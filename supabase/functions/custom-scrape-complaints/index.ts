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
    const encodedCompanyName = encodeURIComponent(clientName.toLowerCase().replace(/\s+/g, ''));
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    
    try {
      // Trustpilot
      const trustpilotResponse = await fetch(`https://www.trustpilot.com/review/${encodedCompanyName}`, {
        headers: { 'User-Agent': userAgent }
      });
      const trustpilotHtml = await trustpilotResponse.text();
      const reviewPattern = /<p[^>]*data-service-review-text[^>]*>([^<]+)<\/p>/g;
      let match;
      while ((match = reviewPattern.exec(trustpilotHtml)) !== null) {
        complaints.push({
          text: match[1].trim(),
          date: new Date().toISOString(),
          source: 'Trustpilot'
        });
      }

      // BBB (Better Business Bureau)
      const bbbResponse = await fetch(`https://www.bbb.org/search?find_text=${encodeURIComponent(clientName)}`, {
        headers: { 'User-Agent': userAgent }
      });
      const bbbHtml = await bbbResponse.text();
      const bbbPattern = /<div[^>]*class="[^"]*complaint-text[^"]*"[^>]*>([^<]+)<\/div>/g;
      while ((match = bbbPattern.exec(bbbHtml)) !== null) {
        complaints.push({
          text: match[1].trim(),
          date: new Date().toISOString(),
          source: 'BBB'
        });
      }

      // ConsumerAffairs
      const consumerAffairsResponse = await fetch(`https://www.consumeraffairs.com/search?query=${encodeURIComponent(clientName)}`, {
        headers: { 'User-Agent': userAgent }
      });
      const consumerAffairsHtml = await consumerAffairsResponse.text();
      const caPattern = /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g;
      while ((match = caPattern.exec(consumerAffairsHtml)) !== null) {
        complaints.push({
          text: match[1].trim(),
          date: new Date().toISOString(),
          source: 'ConsumerAffairs'
        });
      }

      // SiteJabber
      const siteJabberResponse = await fetch(`https://www.sitejabber.com/search?query=${encodeURIComponent(clientName)}`, {
        headers: { 'User-Agent': userAgent }
      });
      const siteJabberHtml = await siteJabberResponse.text();
      const sjPattern = /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g;
      while ((match = sjPattern.exec(siteJabberHtml)) !== null) {
        complaints.push({
          text: match[1].trim(),
          date: new Date().toISOString(),
          source: 'SiteJabber'
        });
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