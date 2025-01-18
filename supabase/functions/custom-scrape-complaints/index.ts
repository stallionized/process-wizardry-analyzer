import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
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
    const { clientName, projectId, page = 1 } = await req.json();
    console.log(`Starting scrape for client: ${clientName}, project: ${projectId}, page: ${page}`);

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required');
    }

    // First, search for the company on Trustpilot
    const searchUrl = `https://www.trustpilot.com/search?query=${encodeURIComponent(clientName)}`;
    console.log('Searching Trustpilot at:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error('Search request failed:', searchResponse.status, searchResponse.statusText);
      throw new Error('Failed to fetch search results');
    }

    const searchHtml = await searchResponse.text();
    console.log('Received search HTML length:', searchHtml.length);
    
    const searchParser = new DOMParser();
    const searchDoc = searchParser.parseFromString(searchHtml, 'text/html');

    if (!searchDoc) {
      console.error('Failed to parse search results HTML');
      throw new Error('Failed to parse search results HTML');
    }

    // Find all business cards/links in search results
    const businessCards = searchDoc.querySelectorAll('a[href^="/review/"]');
    console.log(`Found ${businessCards.length} business results`);

    if (businessCards.length === 0) {
      console.log('Search HTML snippet:', searchHtml.substring(0, 500));
      return new Response(
        JSON.stringify({
          complaints: [],
          hasMore: false,
          error: 'No companies found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the business card with the most reviews
    let bestMatch = null;
    let maxReviews = -1;

    for (const card of businessCards) {
      const cardHtml = card.outerHTML;
      console.log('Processing card:', cardHtml);
      
      const reviewCountText = card.textContent?.match(/\d+\s+reviews?/)?.[0] || '';
      const reviewCount = parseInt(reviewCountText.match(/\d+/)?.[0] || '0');
      console.log(`Found card with ${reviewCount} reviews`);
      
      if (reviewCount > maxReviews) {
        maxReviews = reviewCount;
        bestMatch = card;
      }
    }

    if (!bestMatch) {
      console.error('No valid company profile found among results');
      throw new Error('Could not find a valid company profile');
    }

    // Get the company profile URL
    const companyPath = bestMatch.getAttribute('href');
    console.log('Best match company path:', companyPath);
    
    const reviewsUrl = `https://www.trustpilot.com${companyPath}?page=${page}`;
    console.log('Fetching reviews from:', reviewsUrl);

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the reviews page
    const response = await fetch(reviewsUrl);
    if (!response.ok) {
      console.error('Reviews request failed:', response.status, response.statusText);
      throw new Error('Failed to fetch reviews page');
    }

    const html = await response.text();
    console.log('Received reviews HTML length:', html.length);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    if (!doc) {
      console.error('Failed to parse reviews HTML');
      throw new Error('Failed to parse reviews HTML');
    }

    // Find all review cards
    const reviewCards = doc.querySelectorAll('[data-service-review-card-paper]');
    console.log(`Found ${reviewCards.length} review cards`);

    const complaints = [];

    for (const card of reviewCards) {
      try {
        // Get rating (1-5 stars)
        const ratingText = card.querySelector('[data-service-review-rating]')?.textContent || '';
        const rating = parseInt(ratingText.trim());
        console.log(`Processing review with rating: ${rating}`);
        
        // Only process negative reviews (1-2 stars)
        if (rating > 2) continue;

        // Get review text
        const reviewText = card.querySelector('[data-service-review-text]')?.textContent?.trim() || '';
        if (!reviewText) {
          console.log('Skipping review with no text');
          continue;
        }

        // Get date
        const dateElement = card.querySelector('time');
        const date = dateElement?.getAttribute('datetime') || new Date().toISOString();

        // Determine category based on content
        let category = 'General';
        const lowerText = reviewText.toLowerCase();
        if (lowerText.includes('delivery') || lowerText.includes('shipping')) {
          category = 'Delivery';
        } else if (lowerText.includes('quality') || lowerText.includes('defective')) {
          category = 'Product Quality';
        } else if (lowerText.includes('service') || lowerText.includes('support')) {
          category = 'Customer Service';
        } else if (lowerText.includes('price') || lowerText.includes('expensive')) {
          category = 'Pricing';
        }

        console.log(`Storing complaint in category: ${category}`);

        // Store complaint in database
        const { data: complaint, error: insertError } = await supabaseAdmin
          .from('complaints')
          .insert({
            project_id: projectId,
            complaint_text: reviewText,
            source_url: reviewsUrl,
            theme: category,
            trend: 'Negative',
            created_at: date
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error storing complaint:', insertError);
          continue;
        }

        if (complaint) {
          complaints.push({
            source_url: reviewsUrl,
            complaint_text: reviewText,
            category,
            date
          });
        }
      } catch (error) {
        console.error('Error processing review card:', error);
      }
    }

    // Check for next page
    const nextButton = doc.querySelector('[data-pagination-button-next]');
    const hasNextPage = nextButton !== null && !nextButton.hasAttribute('disabled');

    console.log(`Successfully processed ${complaints.length} complaints, hasNextPage: ${hasNextPage}`);

    return new Response(
      JSON.stringify({
        complaints,
        hasMore: hasNextPage
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