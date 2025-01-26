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

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    console.log(`Fetching reviews for place ID: ${placeId}`);

    // Use the Places API with proper headers
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${GOOGLE_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API response:', errorText);
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'INVALID_REQUEST' || data.status === 'REQUEST_DENIED') {
      console.error('Google Places API error:', data.error_message || data.status);
      throw new Error(`Google Places API error: ${data.error_message || data.status}`);
    }

    if (data.status !== 'OK') {
      console.error('Google Places API returned non-OK status:', data.status);
      throw new Error(`Google Places API error: ${data.status}`);
    }
    
    console.log('Received reviews from Google Places API:', data);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store reviews in the database
    if (data.result?.reviews && data.result.reviews.length > 0) {
      const complaints = data.result.reviews.map((review: any) => ({
        project_id: projectId,
        complaint_text: review.text || '',
        source_url: `https://search.google.com/local/reviews?placeid=${placeId}`,
        theme: 'Google Review',
        trend: review.rating >= 4 ? 'Positive' : review.rating <= 2 ? 'Negative' : 'Neutral',
        created_at: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('complaints')
        .upsert(complaints);

      if (insertError) {
        console.error('Error storing reviews:', insertError);
        throw insertError;
      }

      console.log(`Successfully stored ${complaints.length} reviews`);
      
      return new Response(
        JSON.stringify({
          success: true,
          reviewsCount: complaints.length,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.log('No reviews found for this place ID');
      return new Response(
        JSON.stringify({
          success: true,
          reviewsCount: 0,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in google-reviews function:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});