import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { clientName } = await req.json();
    
    if (!clientName) {
      throw new Error('Client name is required');
    }

    console.log(`Starting scraping for ${clientName}`);
    
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const complaints = [];
    
    // Scrape Trustpilot
    try {
      const page = await browser.newPage();
      await page.goto(`https://www.trustpilot.com/review/search?query=${encodeURIComponent(clientName)}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const reviews = await page.evaluate(() => {
        const reviewElements = document.querySelectorAll('[data-service-review-text-typography]');
        const dateElements = document.querySelectorAll('time');
        
        const results = [];
        reviewElements.forEach((review, index) => {
          if (review.textContent && dateElements[index]?.getAttribute('datetime')) {
            results.push({
              text: review.textContent.trim(),
              date: dateElements[index].getAttribute('datetime'),
              source: 'Trustpilot'
            });
          }
        });
        return results;
      });

      complaints.push(...reviews);
      await page.close();
    } catch (error) {
      console.error('Error scraping Trustpilot:', error);
    }

    // Scrape BBB
    try {
      const page = await browser.newPage();
      await page.goto(`https://www.bbb.org/search?find_text=${encodeURIComponent(clientName)}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const reviews = await page.evaluate(() => {
        const reviewElements = document.querySelectorAll('.complaint-text');
        const dateElements = document.querySelectorAll('.complaint-date');
        
        const results = [];
        reviewElements.forEach((review, index) => {
          if (review.textContent && dateElements[index]?.textContent) {
            results.push({
              text: review.textContent.trim(),
              date: new Date(dateElements[index].textContent.trim()).toISOString(),
              source: 'BBB'
            });
          }
        });
        return results;
      });

      complaints.push(...reviews);
      await page.close();
    } catch (error) {
      console.error('Error scraping BBB:', error);
    }

    await browser.close();
    console.log(`Found ${complaints.length} complaints`);

    // Store complaints in the database
    if (complaints.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: insertError } = await supabase
        .from('complaints')
        .upsert(
          complaints.map(complaint => ({
            complaint_text: complaint.text,
            source_url: complaint.source,
            theme: 'Customer Review',
            project_id: req.projectId,
            created_at: complaint.date
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
        complaintsCount: complaints.length,
        complaints
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in custom-scrape-complaints function:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});