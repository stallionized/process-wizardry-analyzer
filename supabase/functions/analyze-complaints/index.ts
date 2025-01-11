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
    console.log('Step 1: Starting complaint analysis');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Test with a sample company to validate OpenAI integration
    const testCompany = "Apple";
    console.log('Step 2: Testing with sample company:', testCompany);

    const prompt = `Analyze complaints about the company "${testCompany}" from sources like BBB, Trustpilot, Consumer Affairs, and social media.

Return a JSON array of complaint themes, where each theme has:
{
  "summary": "Brief description of the complaint theme",
  "volume": "Number of complaints found (numeric)",
  "complaints": [
    {
      "text": "The specific complaint text",
      "source": "Source website name",
      "url": "Direct URL to complaint if available"
    }
  ]
}`;

    console.log('Step 3: Sending request to OpenAI');
    
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
            content: 'You are a complaints analyst. Return only a valid JSON array of complaint themes. Each theme must have a summary, numeric volume, and array of complaints with text, source, and optional url.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    console.log('Step 4: Received response from OpenAI with status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Step 5: Raw OpenAI response:', JSON.stringify(data));

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    let rawContent = data.choices[0].message.content;
    console.log('Step 6: OpenAI content:', rawContent);

    try {
      const parsedContent = JSON.parse(rawContent);
      console.log('Step 7: Successfully parsed JSON content:', parsedContent);

      // Validate the response structure
      if (!Array.isArray(parsedContent.complaints)) {
        throw new Error('Response is not an array of complaints');
      }

      // Validate each complaint theme
      parsedContent.complaints.forEach((theme: any, index: number) => {
        if (!theme.summary || typeof theme.summary !== 'string') {
          throw new Error(`Theme ${index} missing valid summary`);
        }
        if (!theme.volume || typeof theme.volume !== 'number') {
          throw new Error(`Theme ${index} missing valid volume number`);
        }
        if (!Array.isArray(theme.complaints)) {
          throw new Error(`Theme ${index} missing complaints array`);
        }
        theme.complaints.forEach((complaint: any, complaintIndex: number) => {
          if (!complaint.text || typeof complaint.text !== 'string') {
            throw new Error(`Complaint ${complaintIndex} in theme ${index} missing valid text`);
          }
          if (!complaint.source || typeof complaint.source !== 'string') {
            throw new Error(`Complaint ${complaintIndex} in theme ${index} missing valid source`);
          }
        });
      });

      console.log('Step 8: Validation successful, returning response');

      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error processing OpenAI response:', error);
      console.log('Problematic content:', rawContent);
      throw new Error(`Failed to process OpenAI response: ${error.message}`);
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