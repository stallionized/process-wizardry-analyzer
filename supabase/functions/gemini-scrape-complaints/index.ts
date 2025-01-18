import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { clientName, projectId, page = 1 } = await req.json()
    console.log(`Starting scrape for client: ${clientName}, project: ${projectId}, page: ${page}`)

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required')
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First get the URLs from the database
    const { data: scrapingUrls, error: urlError } = await supabaseAdmin
      .from('scraping_urls')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (urlError) {
      console.error('Error fetching URLs:', urlError);
      throw new Error('Failed to fetch scraping URLs');
    }

    const complaints = [];
    const resultsPerPage = 10;
    const startIndex = (page - 1) * resultsPerPage;

    // Function to scrape a single URL using Gemini
    async function scrapeUrl(url: string, source: string) {
      if (!url) return [];

      console.log(`Scraping ${source} at URL: ${url}`);
      
      const prompt = `
        Visit this webpage: ${url}
        Extract customer reviews/complaints that have ratings of 3 stars or less. For each review, provide:
        1. The complete review/complaint text
        2. The exact date of the review/complaint (in ISO format if possible)
        3. The rating given (1-5 stars)
        4. The source URL

        Format the data as a JSON array with objects containing:
        {
          "text": "the complete review/complaint text",
          "date": "the review/complaint date",
          "rating": "the rating (1-5)",
          "source_url": "${url}"
        }

        Only include reviews with ratings of 3 stars or less. If you can't access the page or find reviews, return an empty array.
        Include pagination information if available.
      `;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
          }
        })
      });

      if (!response.ok) {
        console.error(`Error response from Gemini AI for ${source}:`, await response.text());
        return [];
      }

      const result = await response.json();
      console.log(`Raw Gemini AI response for ${source}:`, JSON.stringify(result));

      try {
        const textContent = result.candidates[0].content.parts[0].text;
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          const reviews = JSON.parse(jsonMatch[0]);
          console.log(`Found ${reviews.length} reviews from ${source}`);
          return reviews;
        }
      } catch (error) {
        console.error(`Error parsing ${source} response:`, error);
      }

      return [];
    }

    // Scrape all configured sources
    const scrapingPromises = [
      scrapingUrls.trustpilot_url && scrapeUrl(scrapingUrls.trustpilot_url, 'Trustpilot'),
      scrapingUrls.bbb_url && scrapeUrl(scrapingUrls.bbb_url, 'BBB'),
      scrapingUrls.pissed_customer_url && scrapeUrl(scrapingUrls.pissed_customer_url, 'Pissed Consumer')
    ].filter(Boolean);

    const results = await Promise.all(scrapingPromises);
    const allReviews = results.flat();
    console.log(`Total reviews found: ${allReviews.length}`);

    // Store reviews in database
    for (const review of allReviews) {
      try {
        const { error: insertError } = await supabaseAdmin
          .from('complaints')
          .upsert({
            project_id: projectId,
            source_url: review.source_url,
            complaint_text: review.text,
            theme: `${review.rating} Star Review`,
            trend: 'Negative',
            created_at: review.date || new Date().toISOString()
          }, {
            onConflict: 'project_id,source_url,complaint_text'
          });

        if (insertError) {
          console.error('Error storing complaint:', insertError);
        }
      } catch (error) {
        console.error('Error processing review:', error);
      }
    }

    // Return paginated results
    const paginatedComplaints = allReviews
      .slice(startIndex, startIndex + resultsPerPage)
      .map(review => ({
        source_url: review.source_url,
        complaint_text: review.text,
        date: review.date || new Date().toISOString(),
        category: `${review.rating} Star Review`
      }));

    console.log(`Returning ${paginatedComplaints.length} complaints for page ${page}`);

    return new Response(
      JSON.stringify({
        complaints: paginatedComplaints,
        hasMore: allReviews.length > (startIndex + resultsPerPage)
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