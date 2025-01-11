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
    8. DO NOT LIMIT THE NUMBER OF COMPLAINTS - return ALL verified complaints found

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
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an AI trained to analyze customer complaints across multiple platforms. You must:
1. Always verify complaints are about the correct company
2. Include ALL complaints found, not just examples
3. Never generate fake complaints
4. Always provide accurate counts
5. Include specific sources and URLs when available
6. Return ALL complaints, do not limit the number
7. Respond with valid JSON arrays containing objects with exactly: summary (string), volume (number), complaints (array of objects with text, source, and url)`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Lower temperature for more consistent results
        max_tokens: 4000,
        response_format: { type: "json_object" }
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
      const content = data.choices[0].message.content;
      console.log('Raw content:', content);
      
      // Parse the content, handling both string and object formats
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Extract the complaints array, ensuring we get all complaints
      analysisResult = Array.isArray(parsedContent) ? parsedContent : 
                      Array.isArray(parsedContent.complaints) ? parsedContent.complaints :
                      parsedContent.data || [];
      
      if (!Array.isArray(analysisResult)) {
        console.error('Response is not an array:', analysisResult);
        throw new Error('Response is not an array');
      }
      
      // Validate and normalize each complaint theme
      analysisResult = analysisResult.map(item => {
        if (!Array.isArray(item.complaints)) {
          console.error('Invalid complaints array for theme:', item);
          item.complaints = [];
        }
        
        return {
          summary: String(item.summary || ''),
          volume: item.complaints.length, // Set volume to actual number of complaints
          complaints: item.complaints.map(complaint => ({
            text: String(complaint.text || ''),
            source: String(complaint.source || ''),
            url: String(complaint.url || '')
          }))
        };
      });

      // Sort by actual volume
      analysisResult.sort((a, b) => b.volume - a.volume);
      
      console.log('Processed analysis result:', analysisResult);
      
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

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