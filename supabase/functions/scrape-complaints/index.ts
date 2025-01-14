import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@latest';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName } = await req.json();
    
    if (!clientName) {
      throw new Error('Client name is required');
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    // Define target websites for complaints
    const targetSites = [
      `https://www.trustpilot.com/review/search?query=${encodeURIComponent(clientName)}`,
      `https://www.bbb.org/search?find_text=${encodeURIComponent(clientName)}`,
      `https://www.consumeraffairs.com/search?query=${encodeURIComponent(clientName)}`,
      `https://www.sitejabber.com/search/${encodeURIComponent(clientName)}`
    ];

    const complaints = [];
    
    for (const site of targetSites) {
      console.log(`Crawling ${site}`);
      
      const crawlResult = await firecrawl.crawlUrl(site, {
        limit: 10,
        scrapeOptions: {
          selectors: {
            reviews: {
              selector: '[data-review], .review-content, .review-text, .complaint-text',
              type: 'text'
            },
            dates: {
              selector: '[data-date], .review-date, .complaint-date, time',
              type: 'text'
            },
            ratings: {
              selector: '[data-rating], .rating, .stars',
              type: 'text'
            }
          }
        }
      });

      if (crawlResult.success) {
        const scrapedData = crawlResult.data;
        
        // Process each scraped review
        for (let i = 0; i < scrapedData.reviews?.length || 0; i++) {
          if (scrapedData.reviews[i]) {
            complaints.push({
              complaint_text: scrapedData.reviews[i],
              source_url: scrapedData.url || site,
              date: scrapedData.dates?.[i] || new Date().toISOString(),
              category: 'Customer Review',
              created_at: new Date().toISOString(),
              project_id: req.projectId
            });
          }
        }
      }
    }

    console.log(`Found ${complaints.length} complaints`);

    // Store complaints in the database
    if (complaints.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('complaints')
        .upsert(
          complaints.map(complaint => ({
            complaint_text: complaint.complaint_text,
            source_url: complaint.source_url,
            theme: complaint.category,
            project_id: req.projectId,
            created_at: complaint.date
          }))
        );

      if (insertError) {
        console.error('Error storing complaints:', insertError);
        throw insertError;
      }

      // Update complaint summaries
      const summary = {
        project_id: req.projectId,
        theme: 'Customer Reviews',
        volume: complaints.length,
        sources: [...new Set(complaints.map(c => c.source_url))],
        complaints: complaints.map(c => c.complaint_text)
      };

      const { error: summaryError } = await supabaseAdmin
        .from('complaint_summaries')
        .upsert([summary]);

      if (summaryError) {
        console.error('Error storing summary:', summaryError);
        throw summaryError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        complaintsCount: complaints.length,
        complaints
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-complaints function:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});