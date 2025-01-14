import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scrapeConsumerAffairs(clientName: string) {
  const encodedCompanyName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.consumeraffairs.com/search/?query=${encodedCompanyName}`;
  
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
      return [];
    }

    const html = await response.text();
    const reviewPattern = /<div class="rvw-bd">(.*?)<\/div>/gs;
    const matches = html.matchAll(reviewPattern);
    const complaints = [];

    for (const match of matches) {
      const complaintText = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();

      if (complaintText.length >= 20) {
        complaints.push({
          text: complaintText,
          source: url,
          category: 'ConsumerAffairs Review'
        });
      }

      if (complaints.length >= 10) break;
    }

    return complaints;
  } catch (error) {
    console.error('Error scraping ConsumerAffairs:', error);
    return [];
  }
}

async function scrapeBBB(clientName: string) {
  const encodedCompanyName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.bbb.org/search?find_text=${encodedCompanyName}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      console.error(`BBB returned status ${response.status}`);
      return [];
    }

    const html = await response.text();
    const reviewPattern = /<div class="complaint-detail">(.*?)<\/div>/gs;
    const matches = html.matchAll(reviewPattern);
    const complaints = [];

    for (const match of matches) {
      const complaintText = match[1]
        .replace(/<[^>]+>/g, '')
        .trim();

      if (complaintText.length >= 20) {
        complaints.push({
          text: complaintText,
          source: url,
          category: 'BBB Complaint'
        });
      }

      if (complaints.length >= 10) break;
    }

    return complaints;
  } catch (error) {
    console.error('Error scraping BBB:', error);
    return [];
  }
}

async function scrapeTrustpilot(clientName: string) {
  const encodedCompanyName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.trustpilot.com/review/search?query=${encodedCompanyName}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      console.error(`Trustpilot returned status ${response.status}`);
      return [];
    }

    const html = await response.text();
    const reviewPattern = /<p class="review-content">(.*?)<\/p>/gs;
    const matches = html.matchAll(reviewPattern);
    const complaints = [];

    for (const match of matches) {
      const complaintText = match[1]
        .replace(/<[^>]+>/g, '')
        .trim();

      if (complaintText.length >= 20) {
        complaints.push({
          text: complaintText,
          source: url,
          category: 'Trustpilot Review'
        });
      }

      if (complaints.length >= 10) break;
    }

    return complaints;
  } catch (error) {
    console.error('Error scraping Trustpilot:', error);
    return [];
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
    
    // Scrape from multiple sources
    const [consumerAffairsComplaints, bbbComplaints, trustpilotComplaints] = await Promise.all([
      scrapeConsumerAffairs(clientName),
      scrapeBBB(clientName),
      scrapeTrustpilot(clientName)
    ]);

    const allComplaints = [
      ...consumerAffairsComplaints,
      ...bbbComplaints,
      ...trustpilotComplaints
    ].map(complaint => ({
      ...complaint,
      date: new Date().toISOString()
    }));

    console.log(`Found total complaints: ${allComplaints.length}`);
    console.log('Complaints breakdown:', {
      consumerAffairs: consumerAffairsComplaints.length,
      bbb: bbbComplaints.length,
      trustpilot: trustpilotComplaints.length
    });

    // Store complaints in the database if any were found
    if (allComplaints.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Filter out duplicate complaints based on text content
      const uniqueComplaints = allComplaints.filter((complaint, index, self) =>
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
        complaintsCount: allComplaints.length,
        complaints: allComplaints
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