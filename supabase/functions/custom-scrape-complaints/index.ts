import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  clientName: string;
  projectId: string;
  page?: number;
}

async function fetchAndParse(url: string) {
  console.log('Fetching URL:', url);
  const response = await fetch(url);
  const html = await response.text();
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

async function scrapeReviews(url: string) {
  try {
    const document = await fetchAndParse(url);
    if (!document) {
      console.error('Failed to parse document');
      return { reviews: [], hasNextPage: false };
    }

    // Find all review cards
    const reviewElements = document.querySelectorAll('[data-service-review-card-paper]');
    const reviews = [];

    for (const reviewElement of reviewElements) {
      try {
        // Get rating
        const ratingText = reviewElement.querySelector('[data-service-review-rating]')?.textContent || '';
        const rating = parseInt(ratingText.trim());
        
        // Only process negative reviews (1-2 stars)
        if (rating > 2) continue;

        // Get review text
        const textElement = reviewElement.querySelector('[data-service-review-text]');
        const text = textElement?.textContent?.trim() || '';

        // Get date
        const dateElement = reviewElement.querySelector('time');
        const date = dateElement?.getAttribute('datetime') || new Date().toISOString();

        // Get category based on common complaint themes
        let category = 'General';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('delivery') || lowerText.includes('shipping')) {
          category = 'Delivery';
        } else if (lowerText.includes('quality') || lowerText.includes('defective')) {
          category = 'Product Quality';
        } else if (lowerText.includes('service') || lowerText.includes('support')) {
          category = 'Customer Service';
        } else if (lowerText.includes('price') || lowerText.includes('expensive')) {
          category = 'Pricing';
        }

        reviews.push({
          text,
          date,
          category,
          rating
        });
      } catch (error) {
        console.error('Error processing review element:', error);
      }
    }

    // Check for next page
    const nextButton = document.querySelector('[data-pagination-button-next]');
    const hasNextPage = nextButton !== null && !nextButton.hasAttribute('disabled');

    console.log(`Scraped ${reviews.length} negative reviews, hasNextPage: ${hasNextPage}`);
    return { reviews, hasNextPage };
  } catch (error) {
    console.error('Error scraping reviews:', error);
    return { reviews: [], hasNextPage: false };
  }
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Search for company on Trustpilot
    const searchUrl = `https://www.trustpilot.com/search?query=${encodeURIComponent(clientName)}`;
    const searchDoc = await fetchAndParse(searchUrl);
    
    if (!searchDoc) {
      throw new Error('Failed to parse search results');
    }

    // Find all company results
    const companyElements = searchDoc.querySelectorAll('[data-business-unit-card-paper]');
    let bestMatch = null;
    let maxReviews = 0;

    for (const element of companyElements) {
      try {
        const nameElement = element.querySelector('h2');
        const reviewCountElement = element.querySelector('[data-reviews-count-typography]');
        const linkElement = element.querySelector('a');

        if (nameElement && reviewCountElement && linkElement) {
          const companyName = nameElement.textContent?.trim() || '';
          const reviewCountText = reviewCountElement.textContent?.trim() || '0';
          const reviewCount = parseInt(reviewCountText.replace(/[^0-9]/g, ''));
          const url = linkElement.getAttribute('href') || '';

          if (reviewCount > maxReviews) {
            maxReviews = reviewCount;
            bestMatch = {
              name: companyName,
              url: `https://www.trustpilot.com${url}`,
              reviewCount
            };
          }
        }
      } catch (error) {
        console.error('Error processing company element:', error);
      }
    }

    if (!bestMatch) {
      console.log(`No Trustpilot pages found for ${clientName}`);
      return new Response(
        JSON.stringify({ complaints: [], hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Selected company: ${bestMatch.name} (${bestMatch.reviewCount} reviews)`);
    const reviewsUrl = `${bestMatch.url}?sort=recency&page=${page}`;
    const { reviews, hasNextPage } = await scrapeReviews(reviewsUrl);

    // Store reviews in database
    const complaints = [];
    for (const review of reviews) {
      try {
        const { data: insertedComplaint, error: insertError } = await supabaseAdmin
          .from('complaints')
          .insert({
            project_id: projectId,
            complaint_text: review.text,
            source_url: reviewsUrl,
            theme: review.category,
            trend: 'Negative',
            created_at: review.date
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error storing complaint:', insertError);
        } else {
          complaints.push({
            source_url: reviewsUrl,
            complaint_text: review.text,
            category: review.category,
            date: review.date
          });
        }
      } catch (error) {
        console.error('Error processing review:', error);
      }
    }

    console.log(`Returning ${complaints.length} complaints for page ${page}`);
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