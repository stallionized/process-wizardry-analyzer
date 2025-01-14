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
    const { clientName, projectId } = await req.json();
    
    if (!clientName) {
      throw new Error('Client name is required');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    console.log(`Starting scraping for ${clientName} with project ID ${projectId}`);
    
    const complaints = [];
    const encodedCompanyName = encodeURIComponent(clientName);
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    
    try {
      // Trustpilot
      console.log('Attempting to scrape Trustpilot...');
      const trustpilotUrl = `https://www.trustpilot.com/review/www.${clientName.toLowerCase().replace(/\s+/g, '')}.com`;
      console.log('Trustpilot URL:', trustpilotUrl);
      const trustpilotResponse = await fetch(trustpilotUrl, {
        headers: { 'User-Agent': userAgent }
      });
      const trustpilotHtml = await trustpilotResponse.text();
      const reviewPattern = /<p[^>]*data-service-review-text[^>]*>([^<]+)<\/p>/g;
      let match;
      while ((match = reviewPattern.exec(trustpilotHtml)) !== null) {
        complaints.push({
          text: match[1].trim(),
          date: new Date().toISOString(),
          source: trustpilotUrl
        });
      }
      console.log(`Found ${complaints.length} complaints from Trustpilot`);

      // BBB (Better Business Bureau)
      console.log('Attempting to scrape BBB...');
      const bbbUrl = `https://www.bbb.org/search?find_text=${encodedCompanyName}`;
      console.log('BBB URL:', bbbUrl);
      const bbbResponse = await fetch(bbbUrl, {
        headers: { 'User-Agent': userAgent }
      });
      const bbbHtml = await bbbResponse.text();
      const bbbPattern = /<div[^>]*class="[^"]*complaint-text[^"]*"[^>]*>([^<]+)<\/div>/g;
      let bbbCount = 0;
      while ((match = bbbPattern.exec(bbbHtml)) !== null) {
        complaints.push({
          text: match[1].trim(),
          date: new Date().toISOString(),
          source: bbbUrl
        });
        bbbCount++;
      }
      console.log(`Found ${bbbCount} complaints from BBB`);

      // ConsumerAffairs
      console.log('Attempting to scrape ConsumerAffairs...');
      const caUrl = `https://www.consumeraffairs.com/search?query=${encodedCompanyName}`;
      console.log('ConsumerAffairs URL:', caUrl);
      const consumerAffairsResponse = await fetch(caUrl, {
        headers: { 'User-Agent': userAgent }
      });
      const consumerAffairsHtml = await consumerAffairsResponse.text();
      const caPattern = /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g;
      let caCount = 0;
      while ((match = caPattern.exec(consumerAffairsHtml)) !== null) {
        complaints.push({
          text: match[1].trim(),
          date: new Date().toISOString(),
          source: caUrl
        });
        caCount++;
      }
      console.log(`Found ${caCount} complaints from ConsumerAffairs`);

      // SiteJabber
      console.log('Attempting to scrape SiteJabber...');
      const sjUrl = `https://www.sitejabber.com/reviews/${clientName.toLowerCase().replace(/\s+/g, '-')}`;
      console.log('SiteJabber URL:', sjUrl);
      const siteJabberResponse = await fetch(sjUrl, {
        headers: { 'User-Agent': userAgent }
      });
      const siteJabberHtml = await siteJabberResponse.text();
      const sjPattern = /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g;
      let sjCount = 0;
      while ((match = sjPattern.exec(siteJabberHtml)) !== null) {
        complaints.push({
          text: match[1].trim(),
          date: new Date().toISOString(),
          source: sjUrl
        });
        sjCount++;
      }
      console.log(`Found ${sjCount} complaints from SiteJabber`);

    } catch (error) {
      console.error('Error during scraping:', error);
      // Continue execution even if scraping fails
    }

    // Store complaints in the database if any were found
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
            trend: 'Recent',
            project_id: projectId,
            created_at: complaint.date
          }))
        );

      if (insertError) {
        console.error('Error storing complaints:', insertError);
        throw insertError;
      }
    }

    console.log(`Scraping completed. Found total of ${complaints.length} complaints`);

    return new Response(
      JSON.stringify({
        success: true,
        complaintsCount: complaints.length,
        complaints
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
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