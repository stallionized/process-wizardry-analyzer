import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scrapeConsumerAffairs(clientName: string) {
  console.log('Scraping ConsumerAffairs for:', clientName);
  const encodedCompanyName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.consumeraffairs.com/search/?query=${encodedCompanyName}`;
  
  try {
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
        .trim();

      if (complaintText.length >= 20) {
        complaints.push({
          text: complaintText,
          source: url,
          date: new Date().toISOString(),
          category: 'ConsumerAffairs Review'
        });
      }
    }

    console.log(`Found ${complaints.length} complaints on ConsumerAffairs`);
    return complaints;
  } catch (error) {
    console.error('Error scraping ConsumerAffairs:', error);
    return [];
  }
}

async function scrapeBBB(clientName: string) {
  console.log('Scraping BBB for:', clientName);
  const encodedCompanyName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.bbb.org/search?find_text=${encodedCompanyName}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`BBB returned status ${response.status}`);
      return [];
    }

    const html = await response.text();
    const reviewPattern = /<div class="complaint">(.*?)<\/div>/gs;
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
          date: new Date().toISOString(),
          category: 'BBB Complaint'
        });
      }
    }

    console.log(`Found ${complaints.length} complaints on BBB`);
    return complaints;
  } catch (error) {
    console.error('Error scraping BBB:', error);
    return [];
  }
}

async function scrapeTrustpilot(clientName: string) {
  console.log('Scraping Trustpilot for:', clientName);
  const encodedCompanyName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.trustpilot.com/review/search?query=${encodedCompanyName}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
          date: new Date().toISOString(),
          category: 'Trustpilot Review'
        });
      }
    }

    console.log(`Found ${complaints.length} complaints on Trustpilot`);
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
    ];

    console.log('Total complaints found:', {
      total: allComplaints.length,
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

      console.log('Storing complaints in database...');
      const { error: insertError } = await supabase
        .from('complaints')
        .upsert(
          allComplaints.map(complaint => ({
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
      console.log('Successfully stored complaints in database');
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