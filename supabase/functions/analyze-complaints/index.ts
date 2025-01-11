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
    - Consumer Financial Protection Bureau (CFPB)
    - Social media platforms (Twitter, LinkedIn)
    - Industry-specific review sites

    Follow these STRICT rules:
    1. Focus on complaints from the last 2 years
    2. Verify each complaint is specifically about ${companyName}
    3. Group complaints into clear, specific themes (maximum 20 themes)
    4. For each theme:
       - Include ALL verified complaints you find
       - Always include the exact source website and URL
       - Keep the original complaint text
       - Never summarize or combine complaints
    5. Count complaints accurately - each unique complaint counts once
    6. Never generate or fabricate complaints
    7. If a complaint appears on multiple sites, count it only once
    8. DO NOT LIMIT the number of complaints per theme
    9. Return the top 20 themes by complaint volume
    10. IMPORTANT: If you find ANY complaints at all, you MUST include them in the response

    ${topics ? `Pay special attention to complaints about: ${topics}. Prioritize these topics when identifying themes.` : ''}

    Format the response as a JSON array where each object has:
    {
      "summary": "Clear description of the complaint theme",
      "complaints": [
        {
          "text": "The exact complaint text",
          "source": "Specific source website name",
          "url": "Direct URL to the complaint if available"
        }
      ]
    }

    Sort themes by number of complaints in descending order and return only the top 20 themes.
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
2. Include ALL complaints found within each theme
3. Never generate fake complaints
4. Always provide accurate counts
5. Include specific sources and URLs when available
6. Return ALL complaints within each theme
7. Limit response to top 20 themes by volume
8. If you find ANY complaints at all, you MUST include them in the response
9. Respond with valid JSON arrays containing objects with exactly: summary (string), complaints (array of objects with text, source, and url)`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
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
      
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      
      analysisResult = Array.isArray(parsedContent) ? parsedContent : 
                      Array.isArray(parsedContent.complaints) ? parsedContent.complaints :
                      parsedContent.data || [];
      
      if (!Array.isArray(analysisResult)) {
        console.error('Response is not an array:', analysisResult);
        throw new Error('Response is not an array');
      }
      
      // Validate and normalize each complaint theme
      analysisResult = analysisResult
        .filter(item => item.complaints && item.complaints.length > 0)
        .map(item => ({
          summary: String(item.summary || ''),
          complaints: (item.complaints || []).map(complaint => ({
            text: String(complaint.text || ''),
            source: String(complaint.source || ''),
            url: String(complaint.url || '')
          }))
        }))
        .filter(item => item.complaints.length > 0)
        .sort((a, b) => b.complaints.length - a.complaints.length)
        .slice(0, 20);
      
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