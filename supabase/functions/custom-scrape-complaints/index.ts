import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PAGES_PER_SOURCE = 5; // Limit to 5 pages per source to avoid timeouts
const MAX_COMPLAINTS_PER_SOURCE = 50; // Maximum complaints to fetch per source

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
      // Trustpilot (paginated)
      console.log('Attempting to scrape Trustpilot...');
      for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
        const trustpilotUrl = `https://www.trustpilot.com/review/www.${clientName.toLowerCase().replace(/\s+/g, '')}.com?page=${page}`;
        console.log(`Scraping Trustpilot page ${page}:`, trustpilotUrl);
        
        const trustpilotResponse = await fetch(trustpilotUrl, {
          headers: { 'User-Agent': userAgent }
        });
        
        if (!trustpilotResponse.ok) {
          console.log(`Trustpilot page ${page} returned status ${trustpilotResponse.status}. Stopping pagination.`);
          break;
        }
        
        const trustpilotHtml = await trustpilotResponse.text();
        const reviewPattern = /<p[^>]*data-service-review-text[^>]*>([^<]+)<\/p>/g;
        let match;
        let foundOnPage = 0;
        
        while ((match = reviewPattern.exec(trustpilotHtml)) !== null) {
          complaints.push({
            text: match[1].trim(),
            date: new Date().toISOString(),
            source: trustpilotUrl
          });
          foundOnPage++;
        }
        
        console.log(`Found ${foundOnPage} complaints on Trustpilot page ${page}`);
        if (foundOnPage === 0) break; // No more reviews found
        if (complaints.length >= MAX_COMPLAINTS_PER_SOURCE) break;
      }

      // BBB (Better Business Bureau - paginated)
      console.log('Attempting to scrape BBB...');
      for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
        const bbbUrl = `https://www.bbb.org/search?find_text=${encodedCompanyName}&page=${page}`;
        console.log(`Scraping BBB page ${page}:`, bbbUrl);
        
        const bbbResponse = await fetch(bbbUrl, {
          headers: { 'User-Agent': userAgent }
        });
        
        if (!bbbResponse.ok) {
          console.log(`BBB page ${page} returned status ${bbbResponse.status}. Stopping pagination.`);
          break;
        }
        
        const bbbHtml = await bbbResponse.text();
        const bbbPattern = /<div[^>]*class="[^"]*complaint-text[^"]*"[^>]*>([^<]+)<\/div>/g;
        let foundOnPage = 0;
        
        while ((match = bbbPattern.exec(bbbHtml)) !== null) {
          complaints.push({
            text: match[1].trim(),
            date: new Date().toISOString(),
            source: bbbUrl
          });
          foundOnPage++;
        }
        
        console.log(`Found ${foundOnPage} complaints on BBB page ${page}`);
        if (foundOnPage === 0) break;
        if (complaints.length >= MAX_COMPLAINTS_PER_SOURCE) break;
      }

      // ConsumerAffairs (paginated)
      console.log('Attempting to scrape ConsumerAffairs...');
      for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
        const caUrl = `https://www.consumeraffairs.com/search?query=${encodedCompanyName}&page=${page}`;
        console.log(`Scraping ConsumerAffairs page ${page}:`, caUrl);
        
        const consumerAffairsResponse = await fetch(caUrl, {
          headers: { 'User-Agent': userAgent }
        });
        
        if (!consumerAffairsResponse.ok) {
          console.log(`ConsumerAffairs page ${page} returned status ${consumerAffairsResponse.status}. Stopping pagination.`);
          break;
        }
        
        const consumerAffairsHtml = await consumerAffairsResponse.text();
        const caPattern = /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g;
        let foundOnPage = 0;
        
        while ((match = caPattern.exec(consumerAffairsHtml)) !== null) {
          complaints.push({
            text: match[1].trim(),
            date: new Date().toISOString(),
            source: caUrl
          });
          foundOnPage++;
        }
        
        console.log(`Found ${foundOnPage} complaints on ConsumerAffairs page ${page}`);
        if (foundOnPage === 0) break;
        if (complaints.length >= MAX_COMPLAINTS_PER_SOURCE) break;
      }

      // SiteJabber (paginated)
      console.log('Attempting to scrape SiteJabber...');
      for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
        const sjUrl = `https://www.sitejabber.com/reviews/${clientName.toLowerCase().replace(/\s+/g, '-')}?page=${page}`;
        console.log(`Scraping SiteJabber page ${page}:`, sjUrl);
        
        const siteJabberResponse = await fetch(sjUrl, {
          headers: { 'User-Agent': userAgent }
        });
        
        if (!siteJabberResponse.ok) {
          console.log(`SiteJabber page ${page} returned status ${siteJabberResponse.status}. Stopping pagination.`);
          break;
        }
        
        const siteJabberHtml = await siteJabberResponse.text();
        const sjPattern = /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g;
        let foundOnPage = 0;
        
        while ((match = sjPattern.exec(siteJabberHtml)) !== null) {
          complaints.push({
            text: match[1].trim(),
            date: new Date().toISOString(),
            source: sjUrl
          });
          foundOnPage++;
        }
        
        console.log(`Found ${foundOnPage} complaints on SiteJabber page ${page}`);
        if (foundOnPage === 0) break;
        if (complaints.length >= MAX_COMPLAINTS_PER_SOURCE) break;
      }

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