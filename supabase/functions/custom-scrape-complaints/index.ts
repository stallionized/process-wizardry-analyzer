import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  clientName: string;
  projectId: string;
  page?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, projectId, page = 1 } = await req.json() as ScrapeRequest;
    console.log(`Starting Trustpilot scrape for client: ${clientName}, project: ${projectId}`);

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Search for company on Trustpilot
    const searchUrl = `https://www.trustpilot.com/search?query=${encodeURIComponent(clientName)}`;
    const searchPrompt = `
      Visit this URL: ${searchUrl}
      Find ${clientName}'s Trustpilot review page.
      Return ONLY the exact URL of their main review page.
      If not found, return "null".
      Important: Return ONLY the URL, nothing else.
    `;

    console.log('Sending search prompt to Gemini');
    const searchResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: searchPrompt
          }]
        }]
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const searchResult = await searchResponse.json();
    console.log('Search result:', searchResult);

    if (!searchResult.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const reviewPageUrl = searchResult.candidates[0].content.parts[0].text.trim();
    
    if (!reviewPageUrl || reviewPageUrl === 'null') {
      console.log(`No Trustpilot page found for ${clientName}`);
      return new Response(
        JSON.stringify({ complaints: [], hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found Trustpilot page: ${reviewPageUrl}`);

    // Step 2: Scrape reviews
    const scrapePrompt = `
      Visit this Trustpilot URL: ${reviewPageUrl}
      Find and extract negative customer reviews about ${clientName}.
      For each review:
      1. Extract the complete review text
      2. Get the exact review date
      3. Categorize the review (e.g., "Customer Service", "Product Quality", etc.)
      
      Return the data as a JSON array with objects containing:
      {
        "text": "the complete review text",
        "date": "date in ISO format",
        "category": "review category"
      }
      
      Important:
      - Focus on negative reviews/complaints
      - Include full review text
      - Return valid JSON array only
      - If you can't access the page, return []
    `;

    console.log('Sending scrape prompt to Gemini');
    const scrapeResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: scrapePrompt
          }]
        }]
      })
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Gemini scrape error:', errorText);
      throw new Error(`Gemini scrape error: ${errorText}`);
    }

    const scrapeResult = await scrapeResponse.json();
    console.log('Raw Gemini response:', scrapeResult);

    if (!scrapeResult.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid scrape response format from Gemini API');
    }

    const textContent = scrapeResult.candidates[0].content.parts[0].text;
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.log('No JSON array found in response');
      return new Response(
        JSON.stringify({ complaints: [], hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reviews = JSON.parse(jsonMatch[0]);
    console.log(`Parsed ${reviews.length} reviews`);

    const complaints = [];
    for (const review of reviews) {
      try {
        const { data: insertedComplaint, error: insertError } = await supabaseAdmin
          .from('complaints')
          .insert({
            project_id: projectId,
            complaint_text: review.text,
            source_url: reviewPageUrl,
            theme: review.category || 'Trustpilot Review',
            trend: 'Recent',
            created_at: review.date ? new Date(review.date).toISOString() : new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error storing complaint:', insertError);
        } else {
          complaints.push({
            source_url: reviewPageUrl,
            complaint_text: review.text,
            category: review.category || 'Trustpilot Review',
            date: review.date || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error processing review:', error);
      }
    }

    const resultsPerPage = 10;
    const startIndex = (page - 1) * resultsPerPage;
    const paginatedComplaints = complaints.slice(startIndex, startIndex + resultsPerPage);

    console.log(`Returning ${paginatedComplaints.length} complaints for page ${page}`);
    return new Response(
      JSON.stringify({
        complaints: paginatedComplaints,
        hasMore: complaints.length > (startIndex + resultsPerPage)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        complaints: [] 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});