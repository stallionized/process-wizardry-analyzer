import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PAGES_PER_SOURCE = 5;
const MAX_COMPLAINTS_PER_SOURCE = 50;

function isWithinLastYear(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.log('Invalid date format:', dateStr, '- including by default');
      return true; // Include complaints with unparseable dates
    }
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date >= oneYearAgo;
  } catch (e) {
    console.error('Error checking date:', e);
    return true; // Include complaints if date checking fails
  }
}

function extractDate(html: string, datePattern: RegExp): string {
  try {
    const match = html.match(datePattern);
    if (match && match[1]) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    // If no valid date found or parsing fails, return current date
    console.log('No valid date found, using current date');
    return new Date().toISOString();
  } catch (e) {
    console.error('Error extracting date:', e);
    return new Date().toISOString();
  }
}

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
      // Trustpilot scraping
      console.log('Attempting to scrape Trustpilot...');
      for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
        const trustpilotUrl = `https://www.trustpilot.com/review/${clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}?page=${page}`;
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
        const datePattern = /<time[^>]*datetime="([^"]+)"[^>]*>/;
        let match;
        let foundOnPage = 0;
        
        while ((match = reviewPattern.exec(trustpilotHtml)) !== null && complaints.length < MAX_COMPLAINTS_PER_SOURCE) {
          const reviewDate = extractDate(trustpilotHtml.slice(match.index), datePattern);
          complaints.push({
            text: match[1].trim(),
            date: reviewDate,
            source: trustpilotUrl
          });
          foundOnPage++;
        }
        
        console.log(`Found ${foundOnPage} complaints on Trustpilot page ${page}`);
        if (foundOnPage === 0) break;
      }

      // BBB scraping
      console.log('Attempting to scrape BBB...');
      for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
        const bbbUrl = `https://www.bbb.org/search?find_text=${encodedCompanyName}&filter_complaints=1&page=${page}`;
        console.log(`Scraping BBB page ${page}:`, bbbUrl);
        
        const bbbResponse = await fetch(bbbUrl, {
          headers: { 'User-Agent': userAgent }
        });
        
        if (!bbbResponse.ok) {
          console.log(`BBB page ${page} returned status ${bbbResponse.status}. Stopping pagination.`);
          break;
        }
        
        const bbbHtml = await bbbResponse.text();
        const complaintPattern = /<div[^>]*class="[^"]*complaint-text[^"]*"[^>]*>([^<]+)<\/div>/g;
        const datePattern = /<time[^>]*datetime="([^"]+)"[^>]*>/;
        let match;
        let foundOnPage = 0;
        
        while ((match = complaintPattern.exec(bbbHtml)) !== null && complaints.length < MAX_COMPLAINTS_PER_SOURCE) {
          const complaintDate = extractDate(bbbHtml.slice(match.index), datePattern);
          complaints.push({
            text: match[1].trim(),
            date: complaintDate,
            source: bbbUrl
          });
          foundOnPage++;
        }
        
        console.log(`Found ${foundOnPage} complaints on BBB page ${page}`);
        if (foundOnPage === 0) break;
      }

      // ConsumerAffairs scraping
      console.log('Attempting to scrape ConsumerAffairs...');
      for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
        const caUrl = `https://www.consumeraffairs.com/search?query=${encodedCompanyName}&page=${page}`;
        console.log(`Scraping ConsumerAffairs page ${page}:`, caUrl);
        
        const caResponse = await fetch(caUrl, {
          headers: { 'User-Agent': userAgent }
        });
        
        if (!caResponse.ok) {
          console.log(`ConsumerAffairs page ${page} returned status ${caResponse.status}. Stopping pagination.`);
          break;
        }
        
        const caHtml = await caResponse.text();
        const reviewPattern = /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g;
        const datePattern = /<time[^>]*datetime="([^"]+)"[^>]*>/;
        let match;
        let foundOnPage = 0;
        
        while ((match = reviewPattern.exec(caHtml)) !== null && complaints.length < MAX_COMPLAINTS_PER_SOURCE) {
          const reviewDate = extractDate(caHtml.slice(match.index), datePattern);
          complaints.push({
            text: match[1].trim(),
            date: reviewDate,
            source: caUrl
          });
          foundOnPage++;
        }
        
        console.log(`Found ${foundOnPage} complaints on ConsumerAffairs page ${page}`);
        if (foundOnPage === 0) break;
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
      console.error('Error during scraping:', error);
      throw error;
    }

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