import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, topics } = await req.json();
    
    let prompt = `Analyze online complaints about the company "${companyName}" and its common variations (like abbreviations, alternate spellings, or former names). Consider complaints that are clearly about this company based on context, even if the name isn't an exact match.`;
    
    if (topics) {
      prompt += ` Focus specifically on complaints regarding: ${topics}.`;
    }
    
    prompt += `\n\nFor each complaint, verify it's genuinely about this company before including it in the analysis. Then identify the top 20 complaint themes and trends. For each theme:
    1. Provide a concise summary
    2. Estimate the volume of verified complaints
    3. Provide 3 example complaint URLs or summaries that are definitely about this company
    
    Format the response as a JSON array of objects with properties:
    - summary (string): concise theme description
    - volume (number): estimated complaint volume
    - examples (array): 3 example complaints or URLs
    
    Sort by volume in descending order. If no verified complaints are found, return an empty array.`;

    console.log('Analyzing complaints with prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an AI trained to analyze customer complaints, verify their relevance, and identify patterns. Be precise and thorough in verifying complaints are about the correct company before including them in analysis.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const analysisResult = JSON.parse(data.choices[0].message.content);
    console.log('Analysis result:', analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-complaints function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});