import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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
    console.log(`Starting OpenAI scrape for client: ${clientName}, project: ${projectId}, page: ${page}`)

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required')
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
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

    console.log('Retrieved URLs:', JSON.stringify(scrapingUrls, null, 2));

    // Function to scrape a single URL using OpenAI
    async function scrapeUrl(url: string, source: string) {
      if (!url) {
        console.log(`No URL provided for ${source}, skipping...`);
        return [];
      }

      console.log(`Starting to scrape ${source} at URL: ${url}`);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'system',
              content: `You are a web scraping assistant. Your task is to visit the provided URL and extract ONLY REAL customer reviews that exist on that page. DO NOT generate or fabricate any reviews.
              
              If you cannot access the page or if there are no reviews, return an empty array.
              
              Focus only on negative reviews (3 stars or less).`
            }, {
              role: 'user',
              content: `Visit this webpage: ${url}
                Extract only real customer reviews/complaints with ratings of 3 stars or less.
                For each review, provide:
                1. The exact review/complaint text as it appears on the page
                2. The exact date of the review (in ISO format if possible)
                3. The rating (1-5 stars)
                4. The source URL

                Format as a JSON array with objects:
                {
                  "text": "exact review text",
                  "date": "review date",
                  "rating": "rating number",
                  "source_url": "${url}"
                }

                Only include real reviews with ratings of 3 stars or less.
                If you can't access the page or find reviews, return an empty array.`
            }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response from OpenAI for ${source}:`, errorText);
          return [];
        }

        const result = await response.json();
        console.log(`Raw OpenAI response for ${source}:`, JSON.stringify(result, null, 2));

        try {
          const content = result.choices[0].message.content;
          console.log(`Parsed content for ${source}:`, content);
          
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const reviews = JSON.parse(jsonMatch[0]);
            console.log(`Found ${reviews.length} reviews from ${source}`);
            return reviews;
          } else {
            console.log(`No JSON array found in response for ${source}`);
            return [];
          }
        } catch (error) {
          console.error(`Error parsing ${source} response:`, error);
          return [];
        }
      } catch (error) {
        console.error(`Error scraping ${source}:`, error);
        return [];
      }
    }

    const resultsPerPage = 10;
    const startIndex = (page - 1) * resultsPerPage;

    // Scrape all configured sources
    const scrapingPromises = [
      scrapingUrls.trustpilot_url && scrapeUrl(scrapingUrls.trustpilot_url, 'Trustpilot'),
      scrapingUrls.bbb_url && scrapeUrl(scrapingUrls.bbb_url, 'BBB'),
      scrapingUrls.pissed_customer_url && scrapeUrl(scrapingUrls.pissed_customer_url, 'Pissed Consumer')
    ].filter(Boolean);

    console.log('Starting to scrape URLs...');
    const results = await Promise.all(scrapingPromises);
    const allReviews = results.flat();
    console.log(`Total reviews found across all sources: ${allReviews.length}`);

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