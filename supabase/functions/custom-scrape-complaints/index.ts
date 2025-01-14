import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_COMPLAINTS_PER_SOURCE = 10;

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
    
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    const sources = [
      {
        name: 'ConsumerAffairs',
        url: `https://www.consumeraffairs.com/search/?query=${encodedCompanyName}`,
        pattern: /<div class="rvw-bd">(.*?)<\/div>/gs,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/
      },
      {
        name: 'PissedConsumer',
        url: `https://www.pissedconsumer.com/search.html?query=${encodedCompanyName}`,
        pattern: /<div class="review-text">(.*?)<\/div>/gs,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/
      }
    ];

    for (const source of sources) {
      console.log(`Scraping from ${source.name}...`);
      
      try {
        const response = await fetch(source.url, {
          headers: { 
            'User-Agent': userAgent,
            'Accept': 'text/html',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/'
          }
        });
        
        if (!response.ok) {
          console.log(`${source.name} returned status ${response.status}. Skipping.`);
          continue;
        }
        
        const html = await response.text();
        console.log(`Got HTML response of length: ${html.length}`);

        const matches = html.matchAll(source.pattern);
        let count = 0;
        
        for (const match of matches) {
          if (count >= MAX_COMPLAINTS_PER_SOURCE) break;
          
          let complaintText = match[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
          
          if (complaintText.length < 20) continue;
          
          complaints.push({
            text: complaintText,
            date: new Date().toISOString(),
            source: source.url,
            category: source.name
          });
          
          count++;
          console.log(`Added complaint from ${source.name}: ${complaintText.substring(0, 50)}...`);
        }
        
        // Add a small delay between sources
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
        continue;
      }
    }

    console.log(`Total complaints found: ${complaints.length}`);

    // Store complaints in the database
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