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
    console.log('Analyzing complaints for:', companyName, 'Topics:', topics);

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `Analyze customer complaints about ${companyName}${topics ? ` focusing on ${topics}` : ''} from sources like BBB, Trustpilot, Consumer Affairs, and social media.

Return a JSON array of complaint themes, where each theme contains:
- summary: Brief description of the complaint theme
- volume: Number of complaints found (numeric)
- complaints: Array of specific complaints with text, source, and optional url`;

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
            content: 'You are a complaints analyst. Return only valid JSON arrays of complaint themes. Each theme must have a summary, numeric volume, and array of complaints with text, source, and optional url.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw OpenAI response:', JSON.stringify(data));

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    let complaints;
    try {
      const content = data.choices[0].message.content;
      complaints = JSON.parse(content);
      
      // Ensure we have an array
      if (!Array.isArray(complaints)) {
        complaints = [complaints];
      }

      // Validate and normalize each complaint theme
      complaints = complaints.map((theme: any) => ({
        summary: String(theme.summary || ''),
        volume: Number(theme.volume || 0),
        complaints: Array.isArray(theme.complaints) ? theme.complaints.map((complaint: any) => ({
          text: String(complaint.text || ''),
          source: String(complaint.source || ''),
          url: complaint.url ? String(complaint.url) : undefined
        })) : []
      }));

      console.log('Validated complaints:', JSON.stringify(complaints));
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse OpenAI response as valid JSON');
    }

    return new Response(JSON.stringify(complaints), {
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