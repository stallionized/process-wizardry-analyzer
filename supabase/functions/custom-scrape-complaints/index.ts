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

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch scraping URLs for the project
    const { data: scrapingUrls, error: urlError } = await supabaseAdmin
      .from('scraping_urls')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (urlError || !scrapingUrls) {
      throw new Error('Failed to fetch scraping URLs');
    }

    const complaints: Array<{
      source_url: string;
      complaint_text: string;
      theme: string;
      trend: string;
    }> = [];

    // Function to scrape Trustpilot
    async function scrapeTrustpilot(url: string) {
      if (!url) return;
      
      console.log('Scraping Trustpilot:', url);
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      if (!doc) return;

      const reviews = doc.querySelectorAll('[data-service-review-text]');
      const ratings = doc.querySelectorAll('[data-service-review-rating]');

      reviews.forEach((review, index) => {
        const rating = parseInt(ratings[index]?.textContent?.trim() || '5');
        if (rating <= 2) { // Only process negative reviews
          complaints.push({
            source_url: url,
            complaint_text: review.textContent?.trim() || '',
            theme: 'Customer Service',
            trend: 'Negative'
          });
        }
      });
    }

    // Function to scrape BBB
    async function scrapeBBB(url: string) {
      if (!url) return;
      
      console.log('Scraping BBB:', url);
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      if (!doc) return;

      const reviews = doc.querySelectorAll('.complaint-detail');
      reviews.forEach((review) => {
        complaints.push({
          source_url: url,
          complaint_text: review.textContent?.trim() || '',
          theme: 'BBB Complaint',
          trend: 'Negative'
        });
      });
    }

    // Function to scrape Pissed Consumer
    async function scrapePissedConsumer(url: string) {
      if (!url) return;
      
      console.log('Scraping Pissed Consumer:', url);
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      if (!doc) return;

      const reviews = doc.querySelectorAll('.review-content');
      reviews.forEach((review) => {
        complaints.push({
          source_url: url,
          complaint_text: review.textContent?.trim() || '',
          theme: 'Consumer Complaint',
          trend: 'Negative'
        });
      });
    }

    // Scrape all configured URLs
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
    console.log(`Found ${complaints.length} complaints`);

    // Store complaints in database
    if (complaints.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('complaints')
        .insert(
          complaints.map(complaint => ({
            ...complaint,
            project_id: projectId
          }))
        );

      if (insertError) {
        console.error('Error storing complaints:', insertError);
        throw insertError;
      }
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