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

    // Validate file URLs
    for (const file of files) {
      if (!file.url || typeof file.url !== 'string') {
        console.error('Invalid file URL:', file);
        throw new Error(`Invalid URL for file: ${file.name}`);
      }
    }

    // Download and process the first file
    const fileUrl = files[0].url;
    console.log('Attempting to download file:', fileUrl);

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const fileContent = await response.text();
    console.log('File content loaded, length:', fileContent.length);

    // Process with OpenAI using gpt-4o model
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
            content: `You are a data analysis assistant. Analyze the provided dataset and return ONLY a JSON object with:
              1. A correlation matrix showing relationships between numerical variables
              2. Mappings of any text values to numerical representations
              
              The response must be ONLY a valid JSON object with exactly this structure:
              {
                "correlationMatrix": {
                  "variable1": {
                    "variable2": number,
                    ...
                  },
                  ...
                },
                "mappings": {
                  "columnName": {
                    "textValue": number,
                    ...
                  },
                  ...
                }
              }
              
              Do not include any explanatory text or markdown formatting. Return only the JSON object.`
          },
          {
            role: 'user',
            content: `Analyze this dataset and return the JSON object as specified:\n\n${fileContent}`
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent, structured output
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI raw response:', openaiData);

    if (!openaiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Parse the response content as JSON
    let analysis;
    try {
      analysis = JSON.parse(openaiData.choices[0].message.content.trim());
      console.log('Successfully parsed analysis:', analysis);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', openaiData.choices[0].message.content);
      throw new Error('Failed to parse analysis results as JSON');
    }

    // Validate the analysis structure
    if (!analysis.correlationMatrix || !analysis.mappings) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('Analysis results do not match expected structure');
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