import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { clientName, projectId, page = 1 } = await req.json() as ScrapeRequest
    console.log(`Starting scrape for client: ${clientName}, project: ${projectId}, page: ${page}`)

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required')
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const complaints: ComplaintData[] = []
    const resultsPerPage = 10
    const startIndex = (page - 1) * resultsPerPage

    // Format company names for different review sites
    const formattedCompanyName = clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Define review sources to scrape
    const sources = [
      {
        name: 'Trustpilot',
        url: `https://www.trustpilot.com/review/${formattedCompanyName}`,
        selector: '.styles_reviewContent__0Q2Tg'
      },
      {
        name: 'BBB',
        url: `https://www.bbb.org/search?find_text=${encodeURIComponent(clientName)}`,
        selector: '.complaint-text'
      }
    ];

    for (const source of sources) {
      console.log(`Scraping ${source.name} at URL: ${source.url}`);
      
      const prompt = `
      Visit this webpage: ${source.url}
      Extract customer reviews/complaints in a structured format. For each review, provide:
      1. The complete review/complaint text
      2. The exact date of the review/complaint (in ISO format if possible)
      3. Any rating given (1-5 stars or similar)
      
      Format the data as a JSON array with objects containing:
      {
        "text": "the complete review/complaint text",
        "date": "the review/complaint date",
        "rating": "the rating if available"
      }
      
      Only include actual reviews/complaints from the page. If you can't access the page or find reviews, return an empty array.
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
        continue; // Skip to next source if this one fails
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
              category: `${source.name} Review${review.rating ? ` (${review.rating} stars)` : ''}`,
              date: new Date(review.date).toISOString()
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
                trend: 'neutral'
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