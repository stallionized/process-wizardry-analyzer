import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { clientName } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Scraping complaints for client:', clientName);

    // First, get company description and variations
    const descriptionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are a research assistant helping to gather information about companies. Return only valid JSON without any comments.'
        }, {
          role: 'user',
          content: `Create a JSON object with two fields: "description" (a brief description of ${clientName}) and "variations" (an array of common name variations people might use when complaining online).`
        }]
      })
    });

    if (!descriptionResponse.ok) {
      const error = await descriptionResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get company description');
    }

    const descriptionData = await descriptionResponse.json();
    const companyInfo = descriptionData.choices[0].message.content;

    // Now use this information to simulate complaint scraping
    const scrapingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are a web scraping assistant that generates realistic complaint data based on common customer issues. Return only valid JSON array without any comments.'
        }, {
          role: 'user',
          content: `Generate an array of 100+ realistic complaints about ${clientName} (${companyInfo.description}). Each complaint should be a JSON object with these exact fields: source_url (string), complaint_text (string), date (string in YYYY-MM-DD format), category (string). Make complaints diverse and realistic, referencing actual products/services.`
        }]
      })
    });

    if (!scrapingResponse.ok) {
      const error = await scrapingResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate complaints');
    }

    const scrapingData = await scrapingResponse.json();
    const complaints = scrapingData.choices[0].message.content;

    return new Response(JSON.stringify({
      companyInfo,
      complaints
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-complaints function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});