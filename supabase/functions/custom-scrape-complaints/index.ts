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

    console.log(`Starting scraping for ${clientName}`);
    
    const complaints = [];
    const encodedCompanyName = encodeURIComponent(clientName);
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

    // ConsumerAffairs scraping
    try {
      const url = `https://www.consumeraffairs.com/search?query=${encodedCompanyName}`;
      console.log('Scraping ConsumerAffairs:', url);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': userAgent }
      });
      
      if (!response.ok) {
        console.log(`ConsumerAffairs returned status ${response.status}`);
        throw new Error(`Failed to fetch from ConsumerAffairs: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract reviews using a reliable regex pattern
      const reviewPattern = /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
      let match;
      
      while ((match = reviewPattern.exec(html)) !== null) {
        const complaintText = match[1].trim().replace(/<[^>]*>/g, ''); // Remove any nested HTML tags
        
        if (complaintText) {
          complaints.push({
            text: complaintText,
            date: new Date().toISOString().split('T')[0], // Use YYYY-MM-DD format
            source: url
          });
        }
      }
      
      console.log(`Found ${complaints.length} complaints on ConsumerAffairs`);
      
    } catch (error) {
      console.error('Error scraping ConsumerAffairs:', error);
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