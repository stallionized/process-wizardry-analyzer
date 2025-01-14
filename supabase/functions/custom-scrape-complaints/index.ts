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
    const encodedCompanyName = encodeURIComponent(clientName.toLowerCase());
    
    // Focus on ConsumerAffairs only with a simple approach
    const url = `https://www.consumeraffairs.com/search/?query=${encodedCompanyName}`;
    
    console.log(`Fetching from URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.google.com/'
        }
      });
      
      if (!response.ok) {
        console.error(`ConsumerAffairs returned status ${response.status}`);
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const html = await response.text();
      console.log(`Got HTML response of length: ${html.length}`);

      // Simple regex pattern to extract reviews
      const reviewPattern = /<div class="rvw-bd">(.*?)<\/div>/gs;
      const matches = html.matchAll(reviewPattern);
      
      for (const match of matches) {
        let complaintText = match[1]
          .replace(/<[^>]+>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
        
        if (complaintText.length < 20) continue; // Skip very short texts
        
        complaints.push({
          text: complaintText,
          date: new Date().toISOString(),
          source: url,
          category: 'ConsumerAffairs Review'
        });
        
        console.log(`Found complaint: ${complaintText.substring(0, 50)}...`);
        
        if (complaints.length >= 10) break; // Limit to 10 complaints
      }
      
    } catch (error) {
      console.error('Error scraping ConsumerAffairs:', error);
    }

    console.log(`Total complaints found: ${complaints.length}`);

    // Store complaints in the database if any were found
    if (complaints.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Filter out duplicate complaints based on text content
      const uniqueComplaints = complaints.filter((complaint, index, self) =>
        index === self.findIndex((c) => c.text === complaint.text)
      );

      console.log(`Storing ${uniqueComplaints.length} unique complaints`);

      const { error: insertError } = await supabase
        .from('complaints')
        .upsert(
          uniqueComplaints.map(complaint => ({
            complaint_text: complaint.text,
            source_url: complaint.source,
            theme: complaint.category,
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