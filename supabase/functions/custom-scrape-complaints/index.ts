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
    const { clientName, projectId } = await req.json();
    console.log(`Starting custom scraping for ${clientName}, project: ${projectId}`);

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: scrapingUrls, error: urlError } = await supabaseAdmin
      .from('scraping_urls')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (urlError || !scrapingUrls) {
      throw new Error('Failed to fetch scraping URLs');
    }

    const complaints: Array<{
      project_id: string;
      source_url: string;
      complaint_text: string;
      theme: string;
      trend: string;
    }> = [];

    async function scrapeTrustpilot(baseUrl: string) {
      if (!baseUrl) return;
      
      let currentPage = 1;
      let hasMorePages = true;
      const maxPages = 50;

      while (hasMorePages && currentPage <= maxPages) {
        const url = currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;
        console.log(`Scraping Trustpilot page ${currentPage}:`, url);
        
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`Failed to fetch page ${currentPage}:`, response.status);
            break;
          }

          const html = await response.text();
          console.log('HTML content length:', html.length);
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          if (!doc) {
            console.error('Failed to parse HTML');
            break;
          }

          // Updated selectors based on current Trustpilot structure
          const reviews = doc.querySelectorAll('p[data-service-review-text-typography="true"]');
          const ratings = doc.querySelectorAll('div[data-service-review-rating]');

          console.log(`Found ${reviews.length} reviews and ${ratings.length} ratings on page ${currentPage}`);

          if (reviews.length === 0) {
            console.log('No more reviews found');
            hasMorePages = false;
            break;
          }

          let foundNegativeReviews = false;
          reviews.forEach((review, index) => {
            const rating = parseInt(ratings[index]?.getAttribute('data-service-review-rating') || '5');
            console.log(`Review ${index + 1} rating:`, rating);
            
            if (rating <= 3) { // Adjusted to include neutral reviews
              foundNegativeReviews = true;
              const complaintText = review.textContent?.trim() || '';
              console.log(`Found negative review: ${complaintText.substring(0, 100)}...`);
              
              complaints.push({
                project_id: projectId,
                source_url: url,
                complaint_text: complaintText,
                theme: 'Customer Service',
                trend: 'Negative'
              });
            }
          });

          const nextPageButton = doc.querySelector('[data-pagination-button-next]');
          if (!nextPageButton || !foundNegativeReviews) {
            console.log('No next page button found or no negative reviews on current page');
            hasMorePages = false;
          } else {
            currentPage++;
          }

        } catch (error) {
          console.error(`Error scraping page ${currentPage}:`, error);
          hasMorePages = false;
        }
      }
    }

    async function scrapeBBB(url: string) {
      if (!url) return;
      
      console.log('Scraping BBB:', url);
      try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        if (!doc) return;

        const reviews = doc.querySelectorAll('.complaint-detail');
        reviews.forEach((review) => {
          complaints.push({
            project_id: projectId,
            source_url: url,
            complaint_text: review.textContent?.trim() || '',
            theme: 'BBB Complaint',
            trend: 'Negative'
          });
        });
      } catch (error) {
        console.error('Error scraping BBB:', error);
      }
    }

    // Function to scrape Pissed Consumer
    async function scrapePissedConsumer(url: string) {
      if (!url) return;
      
      console.log('Scraping Pissed Consumer:', url);
      try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        if (!doc) return;

        const reviews = doc.querySelectorAll('.review-content');
        reviews.forEach((review) => {
          complaints.push({
            project_id: projectId,
            source_url: url,
            complaint_text: review.textContent?.trim() || '',
            theme: 'Consumer Complaint',
            trend: 'Negative'
          });
        });
      } catch (error) {
        console.error('Error scraping Pissed Consumer:', error);
      }
    }

    const scrapePromises = [];
    if (scrapingUrls.trustpilot_url) {
      scrapePromises.push(scrapeTrustpilot(scrapingUrls.trustpilot_url));
    }
    if (scrapingUrls.bbb_url) {
      scrapePromises.push(scrapeBBB(scrapingUrls.bbb_url));
    }
    if (scrapingUrls.pissed_customer_url) {
      scrapePromises.push(scrapePissedConsumer(scrapingUrls.pissed_customer_url));
    }

    await Promise.all(scrapePromises);
    console.log(`Found ${complaints.length} complaints, saving to database...`);

    if (complaints.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('complaints')
        .upsert(
          complaints,
          { 
            onConflict: 'project_id,source_url,complaint_text',
            ignoreDuplicates: true 
          }
        );

      if (insertError) {
        console.error('Error storing complaints:', insertError);
        throw insertError;
      }
      console.log('Successfully saved complaints to database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        complaints,
        hasMore: false
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in custom-scrape-complaints:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
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
