import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, files } = await req.json();
    console.log('Received request for project:', projectId);
    console.log('Files to analyze:', files);

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for analysis');
    }

    // Download and process the first file
    const fileUrl = files[0].url;
    console.log('Attempting to download file:', fileUrl);

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const fileContent = await response.text();
    console.log('File content loaded, first 100 chars:', fileContent.substring(0, 100));

    // Process with OpenAI
    console.log('Sending to OpenAI for analysis...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a data analysis assistant. Your task is to analyze numerical data and create a correlation matrix.

IMPORTANT: You must return ONLY a JSON object with this exact structure, and nothing else:
{
  "correlationMatrix": {
    "column1": {
      "column2": number,
      "column3": number
    },
    "column2": {
      "column3": number
    }
  },
  "mappings": {}
}

Rules:
1. Only analyze numerical columns
2. All correlation values must be between -1 and 1
3. Return symmetric correlations (if A to B is 0.5, B to A is also 0.5)
4. Include self-correlations (always 1.0)
5. Do not include any text, explanations, or markdown
6. The response must be valid JSON`
          },
          {
            role: 'user',
            content: `Parse this data and return only the correlation matrix as specified:\n\n${fileContent}`
          }
        ],
        temperature: 0, // Set to 0 for most consistent output
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response structure:', JSON.stringify(openaiData, null, 2));

    if (!openaiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Parse the response content as JSON
    let analysis;
    try {
      const content = openaiData.choices[0].message.content.trim();
      console.log('Attempting to parse OpenAI content:', content);
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', openaiData.choices[0].message.content);
      throw new Error('Failed to parse analysis results as JSON');
    }

    // Validate the analysis structure
    if (!analysis.correlationMatrix) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('Analysis results missing correlationMatrix');
    }

    // Validate correlation values
    for (const col1 in analysis.correlationMatrix) {
      for (const col2 in analysis.correlationMatrix[col1]) {
        const value = analysis.correlationMatrix[col1][col2];
        if (typeof value !== 'number' || value < -1 || value > 1) {
          console.error(`Invalid correlation value for ${col1}-${col2}:`, value);
          throw new Error(`Invalid correlation value: ${value}`);
        }
      }
    }

    // Save results to Supabase
    const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
    
    const { error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        project_id: projectId,
        results: analysis,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-dataset function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});