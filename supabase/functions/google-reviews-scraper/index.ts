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

    // Initialize a Set to store unique reviews
    const allReviews = new Set();
    let pageToken = '';
    let hasMorePages = true;
    let attemptCount = 0;
    const maxAttempts = 10; // Limit the number of pagination attempts

    while (hasMorePages && attemptCount < maxAttempts) {
      // Construct the URL with pagination token if available
      const baseUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
      const url = pageToken ? `${baseUrl}&pagetoken=${pageToken}` : baseUrl;
      
      console.log(`Fetching page ${attemptCount + 1} of reviews`);
      
      // Fetch the page content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch Google Maps page`);
        break;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      if (!doc) {
        console.error('Failed to parse HTML');
        break;
      }

      // Extract reviews from the page
      const reviewElements = doc.querySelectorAll('.jJc9Ad');
      console.log(`Found ${reviewElements.length} reviews on page ${attemptCount + 1}`);

      if (reviewElements.length === 0) {
        console.log('No more reviews found, ending pagination');
        hasMorePages = false;
        break;
      }

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

      // Look for the "next page" button or token
      const nextPageElement = doc.querySelector('[aria-label="Next page"]');
      if (!nextPageElement) {
        console.log('No next page button found, ending pagination');
        hasMorePages = false;
        break;
      }

      // Extract the next page token if available
      const nextPageUrl = nextPageElement.getAttribute('href');
      if (nextPageUrl) {
        const tokenMatch = nextPageUrl.match(/pagetoken=([^&]+)/);
        pageToken = tokenMatch ? tokenMatch[1] : '';
        if (!pageToken) {
          hasMorePages = false;
          break;
        }
      } else {
        hasMorePages = false;
        break;
      }

      attemptCount++;
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
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