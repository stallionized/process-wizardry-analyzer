import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PAGES_PER_SOURCE = 2;
const MAX_COMPLAINTS_PER_SOURCE = 15;

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
    
    // More varied user agents to prevent blocking
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    
    // Additional search variations to increase coverage
    const searchVariations = [
      clientName,
      `${clientName} complaints`,
      clientName.toLowerCase(),
      clientName.replace(/\s+/g, '-').toLowerCase(),
      clientName.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase()
    ];

    const sources = [
      {
        name: 'ConsumerAffairs',
        baseUrl: (variation) => `https://www.consumeraffairs.com/search/?query=${encodeURIComponent(variation)}`,
        pattern: /<div[^>]*class="[^"]*rvw-bd[^"]*"[^>]*>(.*?)<\/div>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      },
      {
        name: 'PissedConsumer',
        baseUrl: (variation) => `https://www.pissedconsumer.com/search.html?query=${encodeURIComponent(variation)}`,
        pattern: /<div[^>]*class="[^"]*review-text[^"]*"[^>]*>(.*?)<\/div>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      },
      {
        name: 'BBB',
        baseUrl: (variation) => `https://www.bbb.org/search?find_text=${encodeURIComponent(variation)}`,
        pattern: /<div[^>]*class="[^"]*complaint-text[^"]*"[^>]*>(.*?)<\/div>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      },
      {
        name: 'ComplaintsBoard',
        baseUrl: (variation) => `https://www.complaintsboard.com/search?query=${encodeURIComponent(variation)}`,
        pattern: /<div[^>]*class="[^"]*complaint-content[^"]*"[^>]*>(.*?)<\/div>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      }
    ];

    for (const source of sources) {
      console.log(`Scraping from ${source.name}...`);
      
      for (const variation of searchVariations) {
        console.log(`Trying variation: ${variation}`);
        
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        
        for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
          const url = `${source.baseUrl(variation)}${page > 1 ? `&page=${page}` : ''}`;
          console.log(`Fetching: ${url}`);
          
          try {
            const response = await fetch(url, {
              headers: { 
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Referer': 'https://www.google.com/'
              }
            });
            
            if (!response.ok) {
              console.log(`${source.name} page ${page} returned status ${response.status}. Skipping.`);
              continue;
            }
            
            const html = await response.text();
            console.log(`Got HTML response of length: ${html.length}`);

            let foundOnPage = 0;
            const htmlContent = html.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ');
            
            // Extract complaints using more lenient patterns
            const complaintMatches = htmlContent.match(source.pattern) || [];
            console.log(`Found ${complaintMatches.length} potential complaints`);
            
            for (const match of complaintMatches) {
              if (complaints.length >= MAX_COMPLAINTS_PER_SOURCE) break;
              
              // Clean up the complaint text
              let complaintText = match
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .trim();
              
              // Skip if complaint is too short or appears to be spam
              if (complaintText.length < 20 || /[<>]/.test(complaintText)) {
                continue;
              }
              
              // Use current date if we can't extract one
              let complaintDate = new Date().toISOString();
              const dateMatch = htmlContent.match(source.datePattern);
              if (dateMatch && dateMatch[1]) {
                try {
                  complaintDate = new Date(dateMatch[1]).toISOString();
                } catch (e) {
                  console.log(`Failed to parse date: ${dateMatch[1]}`);
                }
              }
              
              complaints.push({
                text: complaintText,
                date: complaintDate,
                source: url,
                category: source.name
              });
              
              foundOnPage++;
              console.log(`Added complaint: ${complaintText.substring(0, 50)}...`);
            }
            
            console.log(`Found ${foundOnPage} valid complaints on ${source.name} page ${page}`);
            if (foundOnPage === 0) break;
            
            // Add a delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`Error scraping ${source.name}:`, error);
            continue;
          }
        }
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