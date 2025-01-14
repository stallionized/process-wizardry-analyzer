import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scrapeBBB(clientName: string) {
  console.log('Scraping BBB for:', clientName);
  const encodedName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.bbb.org/search?find_text=${encodedName}`;
  
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
    const complaints = [];
    const reviewPattern = /<div class="complaint-text">(.*?)<\/div>/gs;
    const matches = html.matchAll(reviewPattern);

    for (const match of matches) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 20) {
        complaints.push({
          text,
          source: url,
          category: 'BBB Complaint'
        });
      }
    }

    console.log(`Found ${complaints.length} BBB complaints`);
    return complaints;
  } catch (error) {
    console.error('Error scraping BBB:', error);
    return [];
  }
}

async function scrapeTrustpilot(clientName: string) {
  console.log('Scraping Trustpilot for:', clientName);
  const encodedName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.trustpilot.com/review/search?query=${encodedName}`;
  
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
    const complaints = [];
    const reviewPattern = /<p class="review-content">(.*?)<\/p>/gs;
    const matches = html.matchAll(reviewPattern);

    for (const match of matches) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 20) {
        complaints.push({
          text,
          source: url,
          category: 'Trustpilot Review'
        });
      }
    }

    console.log(`Found ${complaints.length} Trustpilot reviews`);
    return complaints;
  } catch (error) {
    console.error('Error scraping Trustpilot:', error);
    return [];
  }
}

async function scrapeYelp(clientName: string) {
  console.log('Scraping Yelp for:', clientName);
  const encodedName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.yelp.com/search?find_desc=${encodedName}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`Yelp returned status ${response.status}`);
      return [];
    }

    const html = await response.text();
    const complaints = [];
    const reviewPattern = /<p class="comment">(.*?)<\/p>/gs;
    const matches = html.matchAll(reviewPattern);

    for (const match of matches) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 20) {
        complaints.push({
          text,
          source: url,
          category: 'Yelp Review'
        });
      }
    }

    console.log(`Found ${complaints.length} Yelp reviews`);
    return complaints;
  } catch (error) {
    console.error('Error scraping Yelp:', error);
    return [];
  }
}

async function scrapePissedCustomer(clientName: string) {
  console.log('Scraping PissedCustomer for:', clientName);
  const encodedName = encodeURIComponent(clientName.toLowerCase());
  const url = `https://www.pissedconsumer.com/search.html?query=${encodedName}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`PissedCustomer returned status ${response.status}`);
      return [];
    }

    const html = await response.text();
    const complaints = [];
    const reviewPattern = /<div class="review-text">(.*?)<\/div>/gs;
    const matches = html.matchAll(reviewPattern);

    for (const match of matches) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 20) {
        complaints.push({
          text,
          source: url,
          category: 'PissedCustomer Review'
        });
      }
    }

    console.log(`Found ${complaints.length} PissedCustomer complaints`);
    return complaints;
  } catch (error) {
    console.error('Error scraping PissedCustomer:', error);
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
    
    // Scrape from all sources concurrently
    const [bbbComplaints, trustpilotComplaints, yelpComplaints, pissedCustomerComplaints] = await Promise.all([
      scrapeBBB(clientName),
      scrapeTrustpilot(clientName),
      scrapeYelp(clientName),
      scrapePissedCustomer(clientName)
    ]);

    const allComplaints = [
      ...bbbComplaints,
      ...trustpilotComplaints,
      ...yelpComplaints,
      ...pissedCustomerComplaints
    ];

    console.log('Total complaints found:', {
      total: allComplaints.length,
      bbb: bbbComplaints.length,
      trustpilot: trustpilotComplaints.length,
      yelp: yelpComplaints.length,
      pissedCustomer: pissedCustomerComplaints.length
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
            created_at: new Date().toISOString()
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