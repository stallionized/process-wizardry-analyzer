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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const complaints: ComplaintData[] = [];
    const resultsPerPage = 10;
    const startIndex = (page - 1) * resultsPerPage;

    const reviewSites = [
      {
        name: 'Trustpilot',
        searchUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(clientName)}`,
      },
      {
        name: 'BBB',
        searchUrl: `https://www.bbb.org/search?find_text=${encodeURIComponent(clientName)}`,
      },
      {
        name: 'ConsumerAffairs',
        searchUrl: `https://www.consumeraffairs.com/search?query=${encodeURIComponent(clientName)}`,
      }
    ];

    for (const site of reviewSites) {
      console.log(`Processing ${site.name} for ${clientName}`);
      
      // Step 1: Find the correct review page URL
      const searchPrompt = `
        Visit this search URL: ${site.searchUrl}
        
        1. Search for "${clientName}" on the page
        2. Find and return ONLY the URL of the FIRST relevant review/profile page for this company
        3. Make sure the URL leads directly to reviews or complaints
        4. If you can't find a relevant result, return null
        
        Return ONLY the URL, nothing else. If no relevant URL is found, return null.
      `;

      const searchResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: searchPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
          }
        })
      });

      if (!searchResponse.ok) {
        console.error(`Error response from Gemini AI for ${site.name} search:`, await searchResponse.text());
        continue;
      }

      const searchResult = await searchResponse.json();
      const reviewPageUrl = searchResult.candidates[0].content.parts[0].text.trim();
      
      if (!reviewPageUrl || reviewPageUrl === 'null') {
        console.log(`No relevant review page found for ${clientName} on ${site.name}`);
        continue;
      }

      console.log(`Found review page for ${clientName} on ${site.name}: ${reviewPageUrl}`);

      // Step 2: Scrape the reviews from the found URL
      const scrapePrompt = `
        Visit this URL: ${reviewPageUrl}
        
        Extract customer complaints and negative reviews about ${clientName}. For each complaint:
        1. Extract the complete complaint text
        2. Note the date (use current date if not available)
        3. Categorize the complaint (e.g., "Product Quality", "Customer Service", etc.)
        
        Format as JSON array with objects:
        {
          "text": "complete complaint text",
          "date": "date in ISO format",
          "category": "complaint category",
          "url": "${reviewPageUrl}"
        }
        
        Important:
        - Focus ONLY on negative reviews and complaints
        - Include detailed complaint text
        - If you can't access the page, return an empty array
        - Look for issues about:
          * Product quality/taste
          * Packaging problems
          * Customer service
          * Distribution issues
          * Marketing concerns
      `;

      const scrapeResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: scrapePrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
          }
        })
      });

      if (!scrapeResponse.ok) {
        console.error(`Error response from Gemini AI for ${site.name} scraping:`, await scrapeResponse.text());
        continue;
      }

      const scrapeResult = await scrapeResponse.json();
      console.log(`Raw Gemini AI response for ${site.name}:`, JSON.stringify(scrapeResult));

      try {
        const textContent = scrapeResult.candidates[0].content.parts[0].text;
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const reviews = JSON.parse(jsonMatch[0]);
          
          for (const review of reviews) {
            const complaint: ComplaintData = {
              source_url: review.url,
              complaint_text: review.text,
              category: review.category || `${site.name} Review`,
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
              console.error(`Error storing ${site.name} complaint:`, insertError);
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing ${site.name} response:`, error);
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