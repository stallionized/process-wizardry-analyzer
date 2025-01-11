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
    
    let prompt = `Act as a consumer complaints analyst. Analyze complaints about "${companyName}" from these sources:
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

    Follow these STRICT rules:
    1. Focus ONLY on complaints from the last 2 years
    2. For each complaint theme:
       - Verify it's about this specific company (${companyName})
       - Include ALL verified complaints you find (don't limit the number)
       - Always include the exact source website and URL when available
       - Never summarize or combine complaints
       - Keep the original complaint text
    3. Group complaints into clear themes
    4. Count complaints accurately - each complaint should be counted exactly once
    5. Never generate or fabricate complaints
    6. If a complaint appears on multiple sites, only count it once
    7. Include EVERY complaint you find in the response, not just examples

    ${topics ? `Pay special attention to complaints about: ${topics}` : ''}

    Format the response as a JSON array where each object has:
    {
      "summary": "Clear description of the complaint theme",
      "volume": exact number of verified complaints found,
      "complaints": [
        {
          "text": "The exact complaint text",
          "source": "Specific source website name",
          "url": "Direct URL to the complaint if available"
        }
      ]
    }

    Sort themes by volume in descending order. Include ONLY verified complaints about ${companyName}.
    If no complaints are found, return an empty array: []`;

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
2. Include ALL complaints found, not just examples
3. Never generate fake complaints
4. Always provide accurate counts
5. Include specific sources and URLs when available
6. Respond with valid JSON arrays containing objects with exactly: summary (string), volume (number), complaints (array of objects with text, source, and url)`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 4000,
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
        complaints: Array.isArray(item.complaints) ? item.complaints.map(complaint => ({
          text: String(complaint.text || ''),
          source: String(complaint.source || ''),
          url: String(complaint.url || '')
        })) : []
      }));

      // Verify that complaint counts match the actual number of complaints
      analysisResult = analysisResult.map(item => ({
        ...item,
        volume: item.complaints.length // Ensure volume matches actual number of complaints
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