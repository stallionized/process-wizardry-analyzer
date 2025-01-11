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
    console.log('Analyzing complaints for:', { companyName, topics });
    
    if (!companyName) {
      throw new Error('Company name is required');
    }

    const companyVariations = [
      companyName,
      companyName.toLowerCase(),
      companyName.toUpperCase(),
      ...getCompanyVariations(companyName)
    ].join('", "');

    const prompt = `Act as a consumer complaints analyst. Search and analyze real complaints about any of these company names: "${companyVariations}" from these sources:
    - Better Business Bureau (BBB)
    - Trustpilot
    - Consumer Affairs
    - Google Reviews
    - Ripoff Report
    - Social media (Twitter, Facebook, Reddit)

    Focus on complaints from the last 2 years. For each major complaint theme:
    1. Verify the complaint is about this specific company
    2. Look for patterns across multiple sources
    3. Count the frequency of similar complaints
    4. Provide specific examples with their sources

    ${topics ? `Pay special attention to complaints about: ${topics}` : ''}

    Return a JSON array where each object has:
    {
      "summary": "Brief description of the complaint theme",
      "volume": "Number of complaints found (must match complaints array length)",
      "complaints": [
        {
          "text": "The specific complaint text",
          "source": "Source website name",
          "url": "Direct URL to complaint if available"
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
            content: 'You are a complaints analyst. Return a JSON array of complaint themes. Each theme must have a summary (string), volume (number), and complaints array (objects with text, source, and url).'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI raw response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    let rawContent = data.choices[0].message.content;
    console.log('OpenAI content:', rawContent);

    try {
      const parsedContent = JSON.parse(rawContent);
      console.log('Parsed JSON content:', parsedContent);

      // Extract the array from the response
      const analysisResult = Array.isArray(parsedContent) ? parsedContent : 
                            Array.isArray(parsedContent.data) ? parsedContent.data : 
                            null;

      if (!analysisResult) {
        console.error('Response is not a valid array:', parsedContent);
        throw new Error('Response is not a valid array');
      }

      // Validate each complaint theme
      const validatedResults = analysisResult.map(item => {
        if (!item.complaints || !Array.isArray(item.complaints)) {
          console.warn(`Invalid complaints array for theme "${item.summary}"`);
          return {
            summary: String(item.summary || ''),
            volume: 0,
            complaints: []
          };
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

      console.log('Final validated results:', validatedResults);
      
      // Store results in database
      const { data: storedData, error: dbError } = await supabaseAdmin
        .from('analysis_results')
        .insert({
          project_id: projectId,
          results: validatedResults,
          status: 'completed'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Results stored in database:', storedData);

      return new Response(JSON.stringify(validatedResults), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error processing OpenAI response:', error);
      console.log('Problematic content:', rawContent);
      throw new Error('Failed to process OpenAI response');
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
      'Bud Light'
    );
  }
  
  return variations;
}