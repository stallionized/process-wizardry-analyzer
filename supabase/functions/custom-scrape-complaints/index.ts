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
    const { clientName } = await req.json();
    
    if (!clientName) {
      throw new Error('Client name is required');
    }

    console.log(`Starting scraping for ${clientName}`);
    
    const complaints = [];
    
    // Fetch from Trustpilot
    try {
      const response = await fetch(`https://www.trustpilot.com/review/search?query=${encodeURIComponent(clientName)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = await response.text();
      
      // Basic regex pattern to extract reviews
      const reviewPattern = /<p[^>]*data-service-review-text-typography[^>]*>([^<]+)<\/p>/g;
      const datePattern = /<time[^>]*datetime="([^"]+)"[^>]*>/g;
      
      let reviewMatch;
      let dateMatch;
      
      while ((reviewMatch = reviewPattern.exec(html)) !== null && (dateMatch = datePattern.exec(html)) !== null) {
        complaints.push({
          text: reviewMatch[1].trim(),
          date: dateMatch[1],
          source: 'Trustpilot'
        });
      }
    } catch (error) {
      console.error('Error fetching from Trustpilot:', error);
    }

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