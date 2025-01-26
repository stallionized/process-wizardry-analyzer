import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key is not configured');
    }

    // First, get the place details to get a pagetoken
    const initialUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${GOOGLE_PLACES_API_KEY}`;
    const initialResponse = await fetch(initialUrl);
    const initialData = await initialResponse.json();

    if (!initialResponse.ok) {
      console.error('Error from Google Places API:', initialData);
      throw new Error('Failed to fetch reviews from Google Places API');
    }

    let allReviews = [];
    
    // Get initial reviews
    if (initialData.result && initialData.result.reviews) {
      allReviews = [...initialData.result.reviews];
    }

    // Now use Place Search to get more reviews with different sort options
    const searchTypes = ['newest', 'rating', 'relevance'];
    
    for (const sortBy of searchTypes) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&reviews_sort=${sortBy}&key=${GOOGLE_PLACES_API_KEY}`;
      
      console.log(`Fetching reviews with sort: ${sortBy}`);
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (response.ok && data.result && data.result.reviews) {
        // Add new unique reviews
        const newReviews = data.result.reviews.filter(newReview => 
          !allReviews.some(existingReview => 
            existingReview.time === newReview.time && 
            existingReview.text === newReview.text
          )
        );
        
        allReviews = [...allReviews, ...newReviews];
        console.log(`Added ${newReviews.length} new reviews from ${sortBy} sort`);
      }
    }

    console.log(`Total unique reviews collected: ${allReviews.length}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Transform reviews into complaints format
    const complaints = allReviews.map((review: any) => ({
      project_id: projectId,
      complaint_text: review.text || '',
      source_url: `https://search.google.com/local/reviews?placeid=${placeId}`,
      theme: 'Google Review',
      trend: review.rating >= 4 ? 'Positive' : review.rating <= 2 ? 'Negative' : 'Neutral',
      created_at: new Date(review.time * 1000).toISOString()
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