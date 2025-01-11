import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { companyName, topics } = await req.json();
    
    if (!companyName) {
      throw new Error('Company name is required');
    }

    console.log('Analyzing complaints for company:', companyName, 'topics:', topics);
    
    let prompt = `Act as a consumer complaints analyst. Search and analyze real complaints about "${companyName}" from these sources:
    - Better Business Bureau (BBB)
    - Trustpilot
    - Yelp
    - Consumer Affairs
    - Google Reviews
    - Facebook
    - Reddit (especially r/consumer)
    - Complaints Board
    - Ripoff Report
    - Pissed Consumer

    Focus on complaints from the last 2 years. For each major complaint theme:
    1. Verify the complaint is about this specific company (${companyName})
    2. Look for patterns across multiple sources
    3. Count the frequency of similar complaints
    4. Note specific examples with sources when possible
    5. If available, include direct links to complaint sources

    ${topics ? `Pay special attention to complaints about: ${topics}` : ''}

    Respond with a JSON array of objects. Each object MUST have exactly these properties:
    {
      "summary": "Clear description of the complaint theme",
      "volume": number (estimated complaint count),
      "examples": [
        "Specific complaint 1 with source",
        "Specific complaint 2 with source",
        "Specific complaint 3 with source"
      ]
    }

    Sort by volume in descending order. Include ONLY verified complaints about ${companyName}.
    If truly no complaints are found, return an empty array: []`;

    console.log('Sending request to OpenAI with prompt:', prompt);

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
            content: `You are an AI trained to analyze customer complaints across multiple platforms. You must:
1. Always verify complaints are about the correct company
2. Include specific examples with sources
3. Respond with valid JSON arrays containing objects with exactly: summary (string), volume (number), examples (array of 3 strings)
4. Never include additional properties or formatting`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(data.choices[0].message.content);
      
      // Validate the response format
      if (!Array.isArray(analysisResult)) {
        console.error('Response is not an array:', analysisResult);
        throw new Error('Response is not an array');
      }
      
      // Ensure each item has the required properties and correct types
      analysisResult = analysisResult.map(item => ({
        summary: String(item.summary || ''),
        volume: Number(item.volume) || 0,
        examples: Array.isArray(item.examples) ? item.examples.map(String) : []
      }));
      
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    console.log('Final analysis result:', analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-complaints function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});