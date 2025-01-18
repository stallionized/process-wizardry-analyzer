import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    console.log(`Starting scrape for client: ${clientName}, project: ${projectId}, page: ${page}`);

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

    const reviewSites = [
      {
        name: 'Trustpilot',
        searchUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(clientName)}`,
      },
      {
        name: 'BBB',
        searchUrl: `https://www.bbb.org/search?find_text=${encodeURIComponent(clientName)}`,
      },
      {
        name: 'ConsumerAffairs',
        searchUrl: `https://www.consumeraffairs.com/search?query=${encodeURIComponent(clientName)}`,
      }
    ];

    const complaints = [];

    for (const site of reviewSites) {
      console.log(`Processing ${site.name} for ${clientName}`);
      
      // Step 1: Search for the company and get review page URL
      const searchPrompt = `
        Visit this URL: ${site.searchUrl}
        Search for "${clientName}" and find their review/complaint page.
        Return ONLY the URL of their main review/complaint page.
        If you can't find it, return "null".
        Important: Return ONLY the URL, nothing else.
      `;

      console.log(`Sending search prompt to Gemini for ${site.name}`);
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
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
          }
        })
      });

      if (!searchResponse.ok) {
        console.error(`Error from Gemini search for ${site.name}:`, await searchResponse.text());
        continue;
      }

      const searchResult = await searchResponse.json();
      console.log(`Raw Gemini search response for ${site.name}:`, JSON.stringify(searchResult));

      const reviewPageUrl = searchResult.candidates[0].content.parts[0].text.trim();
      if (!reviewPageUrl || reviewPageUrl === 'null') {
        console.log(`No review page found for ${clientName} on ${site.name}`);
        continue;
      }

      console.log(`Found review page for ${clientName} on ${site.name}: ${reviewPageUrl}`);

      // Step 2: Scrape complaints from the review page
      const scrapePrompt = `
        Visit this URL: ${reviewPageUrl}
        
        Find and extract customer complaints about ${clientName}. For each complaint:
        1. Extract the complete complaint text
        2. Note the date (use current date if not available)
        3. Categorize the complaint (e.g., "Product Quality", "Customer Service", etc.)
        
        Format the results as a JSON array with objects containing:
        {
          "text": "the complete complaint text",
          "date": "date in ISO format",
          "category": "complaint category"
        }
        
        Important:
        - Focus on negative reviews and complaints
        - Include detailed complaint text
        - If you can't access the page, return an empty array []
      `;

      console.log(`Sending scrape prompt to Gemini for ${site.name}`);
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
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
          }
        })
      });

      if (!scrapeResponse.ok) {
        console.error(`Error from Gemini scrape for ${site.name}:`, await scrapeResponse.text());
        continue;
      }

      const scrapeResult = await scrapeResponse.json();
      console.log(`Raw Gemini scrape response for ${site.name}:`, JSON.stringify(scrapeResult));

      try {
        const textContent = scrapeResult.candidates[0].content.parts[0].text;
        console.log(`Extracted text content from Gemini for ${site.name}:`, textContent);

        // Find JSON array in the response
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const reviews = JSON.parse(jsonMatch[0]);
          console.log(`Parsed ${reviews.length} reviews from ${site.name}`);

          for (const review of reviews) {
            // Store in database
            const { data: insertedComplaint, error: insertError } = await supabaseAdmin
              .from('complaints')
              .insert({
                project_id: projectId,
                complaint_text: review.text,
                source_url: reviewPageUrl,
                theme: review.category || `${site.name} Review`,
                trend: 'Recent',
                created_at: review.date ? new Date(review.date).toISOString() : new Date().toISOString()
              })
              .select()
              .single();

            if (insertError) {
              console.error(`Error storing complaint from ${site.name}:`, insertError);
            } else {
              console.log(`Successfully stored complaint from ${site.name}:`, insertedComplaint);
              complaints.push({
                source_url: reviewPageUrl,
                complaint_text: review.text,
                category: review.category || `${site.name} Review`,
                date: review.date || new Date().toISOString()
              });
            }
          }
        } else {
          console.log(`No JSON array found in Gemini response for ${site.name}`);
        }
      } catch (error) {
        console.error(`Error processing ${site.name} response:`, error);
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
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
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