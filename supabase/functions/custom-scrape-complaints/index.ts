import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PAGES_PER_SOURCE = 5;
const MAX_COMPLAINTS_PER_SOURCE = 50;

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

    console.log(`Starting enhanced scraping for ${clientName} with project ID ${projectId}`);
    
    const complaints = [];
    const encodedCompanyName = encodeURIComponent(clientName);
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    
    // Additional search variations to increase coverage
    const searchVariations = [
      clientName,
      `${clientName} complaints`,
      `${clientName} reviews`,
      `${clientName} customer service`,
      `${clientName} feedback`,
      `${clientName} problems`,
      clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      clientName.replace(/\s+/g, ''),
      clientName.toLowerCase()
    ];

    const sources = [
      {
        name: 'Trustpilot',
        baseUrl: (variation) => `https://www.trustpilot.com/review/${variation}`,
        pattern: /<p[^>]*data-service-review-text[^>]*>([^<]+)<\/p>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      },
      {
        name: 'BBB',
        baseUrl: (variation) => `https://www.bbb.org/search?find_text=${encodeURIComponent(variation)}`,
        pattern: /<div[^>]*class="[^"]*complaint-text[^"]*"[^>]*>([^<]+)<\/div>/g,
        datePattern: /<meta[^>]*itemprop="datePublished"[^>]*content="([^"]+)"[^>]*>/g
      },
      {
        name: 'ConsumerAffairs',
        baseUrl: (variation) => `https://www.consumeraffairs.com/search?query=${encodeURIComponent(variation)}`,
        pattern: /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      },
      {
        name: 'SiteJabber',
        baseUrl: (variation) => `https://www.sitejabber.com/reviews/${variation.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        pattern: /<div[^>]*class="[^"]*review-content[^"]*"[^>]*>([^<]+)<\/div>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      },
      {
        name: 'Yelp',
        baseUrl: (variation) => `https://www.yelp.com/biz/${variation.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        pattern: /<p[^>]*class="[^"]*comment__09f24__D0cxf[^"]*"[^>]*>([^<]+)<\/p>/g,
        datePattern: /<span[^>]*class="[^"]*css-chan6m[^"]*"[^>]*>([^<]+)<\/span>/g
      },
      {
        name: 'Google Reviews',
        baseUrl: (variation) => `https://www.google.com/maps/place/${encodeURIComponent(variation)}/reviews`,
        pattern: /<span[^>]*class="[^"]*review-full-text[^"]*"[^>]*>([^<]+)<\/span>/g,
        datePattern: /<span[^>]*class="[^"]*review-date[^"]*"[^>]*>([^<]+)<\/span>/g
      },
      {
        name: 'PissedConsumer',
        baseUrl: (variation) => `https://www.pissedconsumer.com/search.html?query=${encodeURIComponent(variation)}`,
        pattern: /<div[^>]*class="[^"]*review-text[^"]*"[^>]*>([^<]+)<\/div>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      },
      {
        name: 'Complaints Board',
        baseUrl: (variation) => `https://www.complaintsboard.com/search?query=${encodeURIComponent(variation)}`,
        pattern: /<div[^>]*class="[^"]*complaint-text[^"]*"[^>]*>([^<]+)<\/div>/g,
        datePattern: /<time[^>]*datetime="([^"]+)"[^>]*>/g
      }
    ];

    for (const source of sources) {
      console.log(`Scraping from ${source.name}...`);
      
      for (const variation of searchVariations) {
        for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
          const url = `${source.baseUrl(variation)}${page > 1 ? `?page=${page}` : ''}`;
          console.log(`Attempting to fetch: ${url}`);
          
          try {
            const response = await fetch(url, {
              headers: { 
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
              }
            });
            
            if (!response.ok) {
              console.log(`${source.name} page ${page} returned status ${response.status}. Skipping.`);
              break;
            }
            
            const html = await response.text();
            let match;
            let dateMatch;
            let foundOnPage = 0;
            
            // Extract complaints and their dates
            while ((match = source.pattern.exec(html)) !== null && complaints.length < MAX_COMPLAINTS_PER_SOURCE) {
              const complaintText = match[1].trim();
              let complaintDate = new Date().toISOString();

              // Try to find the corresponding date for this complaint
              if (source.datePattern) {
                dateMatch = source.datePattern.exec(html);
                if (dateMatch) {
                  try {
                    complaintDate = new Date(dateMatch[1]).toISOString();
                  } catch (e) {
                    console.log(`Failed to parse date: ${dateMatch[1]}`);
                  }
                }
              }
              
              // Skip if complaint is too short or appears to be spam
              if (complaintText.length < 20 || /[<>]/.test(complaintText)) {
                continue;
              }
              
              complaints.push({
                text: complaintText,
                date: complaintDate,
                source: url,
                category: source.name
              });
              foundOnPage++;
            }
            
            console.log(`Found ${foundOnPage} complaints on ${source.name} page ${page}`);
            if (foundOnPage === 0) break;
            if (complaints.length >= MAX_COMPLAINTS_PER_SOURCE) break;

            // Add a small delay between requests to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error scraping ${source.name}:`, error);
            continue;
          }
        }
      }
    }

    // Store unique complaints in the database
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

    console.log(`Scraping completed. Found total of ${complaints.length} unique complaints`);

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