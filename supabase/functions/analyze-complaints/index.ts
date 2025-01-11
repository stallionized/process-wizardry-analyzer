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
    
    const companyVariations = [
      companyName,
      companyName.toLowerCase(),
      companyName.toUpperCase(),
      ...getCompanyVariations(companyName)
    ].join('", "');

    const prompt = `Act as a consumer complaints analyst. Search and analyze real complaints about any of these company names: "${companyVariations}" from ALL of these sources:

    Major Review & Complaint Platforms:
    - Better Business Bureau (BBB)
    - Trustpilot
    - Yelp
    - Consumer Affairs
    - Google Reviews
    - ComplaintsBoard
    - Ripoff Report
    - Pissed Consumer
    - SiteJabber
    - Complaints.com
    - Angie's List

    Government & Consumer Protection:
    - Consumer Financial Protection Bureau (CFPB)
    - Federal Trade Commission (FTC)
    - National Consumer League (NCL)

    Social Media & Forums:
    - Facebook
    - Twitter
    - Instagram
    - Reddit (especially r/consumer and company-specific subreddits)
    - LinkedIn

    Industry-Specific:
    - Amazon Customer Service (if applicable)
    - TripAdvisor (if applicable)
    - Skytrax (if applicable)
    - Hotel Complaint sites (if applicable)

    Focus on complaints from the last 2 years. For each major complaint theme:
    1. Verify the complaint is about this specific company
    2. Look for patterns across multiple sources
    3. Count the frequency of similar complaints
    4. For each complaint theme, provide ALL specific examples with their sources (do not limit the number of examples)
    5. If available, include direct links to complaint sources

    ${topics ? `Pay special attention to complaints about: ${topics}` : ''}

    IMPORTANT: You must return ALL complaints found for each theme, with no limit on the number of complaints per theme.
    Make sure the volume number matches exactly the number of complaints provided in the complaints array.

    Return a valid JSON array of objects. Each object MUST have exactly these properties:
    {
      "summary": "Clear description of the complaint theme",
      "volume": number (must exactly match the number of complaints in the complaints array),
      "complaints": [
        {
          "text": "The specific complaint text",
          "source": "Name of the source website",
          "url": "Direct URL to the complaint if available"
        }
      ]
    }

    Sort by volume in descending order. Include ONLY verified complaints about ${companyName}.
    If truly no complaints are found, return an empty array: []`;

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
            content: 'You are an AI trained to analyze customer complaints across multiple platforms. You must return ONLY valid JSON arrays containing objects with exactly: summary (string), volume (number), complaints (array of objects with text, source, and url). Never include markdown formatting or additional text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
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
    console.log('OpenAI response received. Attempting to parse content...');

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from OpenAI:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    let rawContent = data.choices[0].message.content;
    console.log('Raw content from OpenAI:', rawContent);

    try {
      // If the content is a string representation of an object with a "data" property,
      // try to extract the array from it
      const parsedContent = JSON.parse(rawContent);
      const analysisResult = Array.isArray(parsedContent) ? parsedContent : 
                            Array.isArray(parsedContent.data) ? parsedContent.data : 
                            null;

      if (!analysisResult) {
        console.error('Response is not a valid array:', parsedContent);
        throw new Error('Response is not a valid array');
      }

      // Validate and transform each item
      const validatedResults = analysisResult.map(item => {
        if (!item.complaints || !Array.isArray(item.complaints)) {
          console.warn(`Invalid complaints array for theme "${item.summary}"`);
          item.complaints = [];
        }

        const complaints = item.complaints.map(complaint => ({
          text: String(complaint.text || ''),
          source: String(complaint.source || ''),
          url: String(complaint.url || '')
        }));

        return {
          summary: String(item.summary || ''),
          volume: complaints.length,
          complaints
        };
      });

      console.log('Successfully parsed and validated analysis result');
      console.log('Number of themes:', validatedResults.length);
      validatedResults.forEach(theme => {
        console.log(`Theme "${theme.summary}": ${theme.complaints.length} complaints`);
      });

      return new Response(JSON.stringify(validatedResults), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Problematic content:', rawContent);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
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

function getCompanyVariations(companyName: string): string[] {
  const variations = [];
  
  if (companyName.toLowerCase().includes('budweiser')) {
    variations.push(
      'Anheuser-Busch',
      'Anheuser Busch',
      'AB InBev',
      'Bud',
      'Bud Light',
      'Budweiser Brewing Company',
      'Anheuser-Busch InBev',
      'AB InBev SA/NV',
      'Busch',
      'Anheuser-Busch Companies'
    );
  }
  
  return variations;
}