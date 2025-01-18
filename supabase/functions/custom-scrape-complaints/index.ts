import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  clientName: string;
  projectId: string;
  page?: number;
}

interface ComplaintData {
  source_url: string;
  complaint_text: string;
  category: string;
  date: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, projectId, page = 1 } = await req.json() as ScrapeRequest;
    console.log(`Starting scrape for client: ${clientName}, project: ${projectId}, page: ${page}`);

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const complaints: ComplaintData[] = [];
    const resultsPerPage = 10;
    const startIndex = (page - 1) * resultsPerPage;

    // Format company names for different review sites
    const companyVariations = [
      clientName.toLowerCase(),
      clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      clientName.toLowerCase().replace(/[^a-z0-9]+/g, ''),
      'budweiser', // Specific for Budweiser
      'anheuser-busch', // Parent company
      'ab-inbev' // Parent company
    ];

    // Define review sources to scrape with specific URLs for Budweiser
    const sources = [
      {
        name: 'Trustpilot',
        url: 'https://www.trustpilot.com/review/budweiser.com',
        selector: '.styles_reviewContent__0Q2Tg'
      },
      {
        name: 'BBB',
        url: 'https://www.bbb.org/us/mo/st-louis/profile/breweries/anheuser-busch-companies-llc-0734-110193/complaints',
        selector: '.dtm-review'
      },
      {
        name: 'ConsumerAffairs',
        url: 'https://www.consumeraffairs.com/food/budweiser.html',
        selector: '.rvw-bd'
      }
    ];

    for (const source of sources) {
      console.log(`Scraping ${source.name} at URL: ${source.url}`);
      
      const prompt = `
      Visit this webpage: ${source.url}
      Extract real customer reviews/complaints about ${clientName}. For each review, provide:
      1. The complete review/complaint text
      2. The date of the review (if available, otherwise use current date)
      3. A category that best describes the complaint (e.g., "Product Quality", "Customer Service", "Delivery", etc.)
      
      Format the data as a JSON array with objects containing:
      {
        "text": "the complete review text",
        "date": "the review date in ISO format",
        "category": "the complaint category"
      }
      
      Only include actual reviews/complaints from the page. If you can't access the page or find reviews, return an empty array.
      Focus on negative reviews and complaints rather than positive reviews.
      For Budweiser specifically, look for complaints about:
      - Product quality
      - Packaging issues
      - Distribution problems
      - Customer service
      - Marketing concerns
      `;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
          }
        })
      });

      if (!response.ok) {
        console.error(`Error response from Gemini AI for ${source.name}:`, await response.text());
        continue;
      }

      const result = await response.json();
      console.log(`Raw Gemini AI response for ${source.name}:`, JSON.stringify(result));

      try {
        const textContent = result.candidates[0].content.parts[0].text;
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const reviews = JSON.parse(jsonMatch[0]);
          
          for (const review of reviews) {
            const complaint: ComplaintData = {
              source_url: source.url,
              complaint_text: review.text,
              category: review.category || `${source.name} Review`,
              date: new Date(review.date || new Date()).toISOString()
            };

            complaints.push(complaint);
            
            // Store in database
            const { error: insertError } = await supabaseAdmin
              .from('complaints')
              .insert({
                project_id: projectId,
                complaint_text: complaint.complaint_text,
                source_url: complaint.source_url,
                theme: complaint.category,
                trend: 'Recent'
              });

            if (insertError) {
              console.error(`Error storing ${source.name} complaint:`, insertError);
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing ${source.name} response:`, error);
      }
    }

    // Sort complaints by date (newest first) and apply pagination
    const sortedComplaints = complaints
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(startIndex, startIndex + resultsPerPage);

    console.log(`Successfully processed ${sortedComplaints.length} complaints`);

    return new Response(
      JSON.stringify({ 
        complaints: sortedComplaints,
        message: `Successfully scraped ${sortedComplaints.length} complaints from page ${page}`,
        hasMore: complaints.length > (startIndex + resultsPerPage)
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        complaints: [] 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});