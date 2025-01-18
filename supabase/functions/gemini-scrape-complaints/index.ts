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
  // Handle CORS preflight requests
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

    console.log('GEMINI_API_KEY is configured, proceeding with API call')

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const complaints: ComplaintData[] = []
    const resultsPerPage = 10
    const startIndex = (page - 1) * resultsPerPage

    // Format company name for Trustpilot URL
    const formattedCompanyName = clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // Construct Trustpilot URL
    const searchUrl = `https://www.trustpilot.com/review/${formattedCompanyName}`;
    console.log('Constructed Trustpilot URL:', searchUrl);
    
    // Use the Gemini API to extract structured data from the webpage
    const prompt = `
    Visit this webpage: ${searchUrl}
    Extract customer reviews in a structured format. For each review, provide:
    1. The review text
    2. The date of the review
    3. The rating (if available)
    
    Format the data as a JSON array with objects containing:
    {
      "text": "the review text",
      "date": "the review date",
      "rating": "the rating (1-5)"
    }
    
    Only include actual reviews from the page. If you can't access the page or find reviews, return an empty array.
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
      const errorText = await response.text();
      console.error('Error response from Gemini AI:', errorText);
      throw new Error(`Gemini AI API returned status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Raw Gemini AI response:', JSON.stringify(result));

    // Parse the response and extract reviews
    let reviews = [];
    try {
      const textContent = result.candidates[0].content.parts[0].text;
      // Extract the JSON array from the response
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        reviews = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      reviews = [];
    }

    // Process each review
    for (const review of reviews.slice(startIndex, startIndex + resultsPerPage)) {
      const complaint: ComplaintData = {
        source_url: searchUrl,
        complaint_text: review.text,
        category: `Trustpilot Review (${review.rating} stars)`,
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
        console.error('Error storing complaint:', insertError);
      }
    }

    console.log(`Successfully processed ${complaints.length} complaints`);

    return new Response(
      JSON.stringify({ 
        complaints,
        message: `Successfully scraped ${complaints.length} complaints from page ${page}`,
        hasMore: complaints.length === resultsPerPage
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