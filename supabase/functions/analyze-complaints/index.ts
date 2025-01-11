import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface ComplaintTheme {
  summary: string;
  volume: number;
  examples: string[];
}

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    let prompt = `Analyze online complaints about the company "${companyName}"`;
    if (topics) {
      prompt += ` specifically regarding: ${topics}`;
    }
    prompt += `. Identify the top 20 complaint themes and trends. For each theme:
    1. Provide a concise summary
    2. Estimate the volume of complaints
    3. Provide 3 example complaint URLs or summaries
    
    Format the response as a JSON array of objects with properties:
    - summary (string): concise theme description
    - volume (number): estimated complaint volume
    - examples (array): 3 example complaints or URLs
    
    Sort by volume in descending order.`;

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
            content: 'You are an AI trained to analyze customer complaints and identify patterns. Be precise and data-focused.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);

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