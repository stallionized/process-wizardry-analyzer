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
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { companyName, topics } = await req.json();
    
    if (!companyName) {
      throw new Error('Company name is required');
    }

    console.log('Analyzing complaints for company:', companyName, 'topics:', topics);
    
    let prompt = `You are a complaints analyst. Your task is to find and analyze REAL complaints about "${companyName}" from these sources:
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

    CRITICAL RULES:
    1. Focus on complaints from the last 2 years
    2. Verify each complaint is specifically about ${companyName}
    3. Group complaints into clear themes
    4. For each theme:
       - Include the EXACT complaint text
       - Always include the source website
       - Include the URL if available
       - Never summarize or modify complaints
    5. Count each unique complaint only once
    6. Never generate fake complaints
    7. If you find ANY complaints at all, you MUST include them
    8. Return ALL complaints you find, grouped by theme
    9. Sort themes by number of complaints (most to least)

    ${topics ? `IMPORTANT: Prioritize finding complaints about: ${topics}` : ''}

    Format your response as a JSON array of objects:
    {
      "summary": "Theme description",
      "complaints": [
        {
          "text": "Exact complaint text",
          "source": "Source website",
          "url": "URL if available"
        }
      ]
    }`;

    console.log('Sending request to OpenAI...');

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
            content: 'You are an AI trained to find and analyze real customer complaints. Never generate fake complaints. Always include any complaints you find in your response.'
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
    console.log('OpenAI response received');

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
      
      // Process and validate complaints
      analysisResult = analysisResult
        .filter(item => item && item.complaints && Array.isArray(item.complaints) && item.complaints.length > 0)
        .map(item => ({
          summary: String(item.summary || '').trim(),
          complaints: item.complaints
            .filter(c => c && c.text)
            .map(complaint => ({
              text: String(complaint.text || '').trim(),
              source: String(complaint.source || '').trim(),
              url: String(complaint.url || '').trim()
            }))
        }))
        .filter(item => item.complaints.length > 0)
        .sort((a, b) => b.complaints.length - a.complaints.length);
      
      console.log('Found complaint themes:', analysisResult.length);
      console.log('Total complaints:', analysisResult.reduce((sum, item) => sum + item.complaints.length, 0));
      
    } catch (error) {
      console.error('Error processing OpenAI response:', error);
      throw new Error('Failed to process complaints data');
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