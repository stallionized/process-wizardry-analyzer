import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId, projectId } = await req.json();
    
    if (!placeId || !projectId) {
      throw new Error('Place ID and Project ID are required');
    }

    console.log('Starting review fetch for place ID:', placeId);

    // Construct the Google Maps URLs for different sort options to get more reviews
    const sortOptions = ['newestfirst', 'mostpositive', 'leastpositive'];
    const allReviews = new Set(); // Use Set to avoid duplicates

    for (const sort of sortOptions) {
      const url = `https://www.google.com/maps/place/?q=place_id:${placeId}&sort=${sort}`;
      console.log(`Fetching reviews with sort option: ${sort}`);
      
      // Fetch the page content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch Google Maps page for sort ${sort}`);
        continue;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      if (!doc) {
        console.error(`Failed to parse HTML for sort ${sort}`);
        continue;
      }

      // Extract reviews from the page
      const reviewElements = doc.querySelectorAll('.jJc9Ad');
      console.log(`Found ${reviewElements.length} reviews for sort ${sort}`);

      reviewElements.forEach((element) => {
        const text = element.querySelector('.wiI7pd')?.textContent;
        const ratingElement = element.querySelector('.kvMYJc')?.getAttribute('aria-label');
        const rating = ratingElement ? parseInt(ratingElement.split(' ')[0]) : 3;
        const timeElement = element.querySelector('.rsqaWe');
        const timeText = timeElement?.textContent;
        const reviewId = element.querySelector('.DU9Pgb')?.getAttribute('data-review-id');

        if (text && !Array.from(allReviews).some((r: any) => r.text === text)) {
          const review = {
            text,
            rating,
            time: new Date().getTime() / 1000,
            timeText,
            reviewId
          };
          allReviews.add(review);
        }
      });

      // Also try to fetch reviews from the "More reviews" section
      const moreReviewsUrl = `https://www.google.com/maps/preview/review/listentity?authuser=0&hl=en&gl=us&pb=!1m2!1y${placeId}!2y${sort}`;
      
      try {
        const moreResponse = await fetch(moreReviewsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (moreResponse.ok) {
          const moreHtml = await moreResponse.text();
          const moreDoc = parser.parseFromString(moreHtml, 'text/html');
          
          if (moreDoc) {
            const moreReviewElements = moreDoc.querySelectorAll('.jJc9Ad');
            console.log(`Found ${moreReviewElements.length} additional reviews for sort ${sort}`);

            moreReviewElements.forEach((element) => {
              const text = element.querySelector('.wiI7pd')?.textContent;
              const ratingElement = element.querySelector('.kvMYJc')?.getAttribute('aria-label');
              const rating = ratingElement ? parseInt(ratingElement.split(' ')[0]) : 3;
              const timeElement = element.querySelector('.rsqaWe');
              const timeText = timeElement?.textContent;
              const reviewId = element.querySelector('.DU9Pgb')?.getAttribute('data-review-id');

              if (text && !Array.from(allReviews).some((r: any) => r.text === text)) {
                const review = {
                  text,
                  rating,
                  time: new Date().getTime() / 1000,
                  timeText,
                  reviewId
                };
                allReviews.add(review);
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching more reviews for sort ${sort}:`, error);
      }
    }

    console.log(`Total unique reviews collected: ${allReviews.size}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Transform reviews into complaints format
    const complaints = Array.from(allReviews).map((review: any) => ({
      project_id: projectId,
      complaint_text: review.text || '',
      source_url: `https://search.google.com/local/reviews?placeid=${placeId}`,
      theme: 'Google Review',
      trend: review.rating >= 4 ? 'Positive' : review.rating <= 2 ? 'Negative' : 'Neutral',
      created_at: new Date().toISOString()
    }));

    // Store reviews in the database
    if (complaints.length > 0) {
      const { error: insertError } = await supabase
        .from('complaints')
        .upsert(complaints);

      if (insertError) {
        console.error('Error storing reviews:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully stored ${complaints.length} reviews`);
    
    return new Response(
      JSON.stringify({
        success: true,
        reviewsCount: complaints.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-reviews-scraper function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});