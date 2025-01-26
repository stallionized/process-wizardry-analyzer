import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

    console.log('Starting review scraping for place ID:', placeId);

    // Launch browser
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Navigate to Google Reviews page
      const url = `https://search.google.com/local/reviews?placeid=${placeId}`;
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Wait for reviews to load
      await page.waitForSelector('div[data-review-id]', { timeout: 10000 });

      // Scroll to load more reviews (3 times)
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);
      }

      // Extract reviews
      const reviews = await page.evaluate(() => {
        const reviewElements = document.querySelectorAll('div[data-review-id]');
        return Array.from(reviewElements).map(element => {
          const textElement = element.querySelector('.review-full-text');
          const ratingElement = element.querySelector('span[aria-label*="stars"]');
          const dateElement = element.querySelector('span[class*="review-date"]');

          return {
            text: textElement ? textElement.textContent : '',
            rating: ratingElement ? parseInt(ratingElement.getAttribute('aria-label')?.split(' ')[0] || '0') : 0,
            date: dateElement ? dateElement.textContent : ''
          };
        });
      });

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Transform and store the reviews
      const complaints = reviews.map(review => ({
        project_id: projectId,
        complaint_text: review.text || '',
        source_url: url,
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

    } finally {
      await browser.close();
    }

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