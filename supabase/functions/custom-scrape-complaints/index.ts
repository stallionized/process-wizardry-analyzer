import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  clientName: string;
  projectId: string;
  page?: number;
}

async function makeGeminiRequest(prompt: string, apiKey: string) {
  console.log('Making Gemini request with prompt:', prompt);
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error response:', errorText);
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const result = await response.json();
  console.log('Gemini API response:', result);

  if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response format from Gemini API');
  }

  const text = result.candidates[0].content.parts[0].text.trim();
  console.log('Extracted text from Gemini response:', text);
  
  try {
    const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
    if (!jsonMatch) {
      console.log('No JSON array found in response');
      return '[]';
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return JSON.stringify(parsed);
  } catch (error) {
    console.error('Error parsing JSON from response:', error);
    return '[]';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, projectId, page = 1 } = await req.json() as ScrapeRequest;
    console.log(`Starting Trustpilot scrape for client: ${clientName}, project: ${projectId}`);

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

    // Step 1: Search for company and find the most reviewed page
    const searchUrl = `https://www.trustpilot.com/search?query=${encodeURIComponent(clientName)}`;
    const searchPrompt = `
      Visit this URL: ${searchUrl}
      Find ${clientName}'s Trustpilot review pages.
      Return a JSON array of objects containing:
      {
        "url": "the exact review page URL",
        "reviewCount": number of reviews (as a number),
        "companyName": "the exact company name as shown on Trustpilot"
      }
      Sort by reviewCount in descending order.
      Only include exact matches or very close matches to "${clientName}".
      Make sure to parse reviewCount as a number, not a string.
      Important: Return ONLY the JSON array, nothing else.
    `;

    console.log('Sending search prompt to Gemini');
    const searchResultsJson = await makeGeminiRequest(searchPrompt, GEMINI_API_KEY);
    let searchResults = [];
    
    try {
      searchResults = JSON.parse(searchResultsJson);
      // Sort by reviewCount in descending order to ensure we get the most reviewed page
      searchResults.sort((a: any, b: any) => b.reviewCount - a.reviewCount);
      console.log('Sorted search results:', searchResults);
    } catch (error) {
      console.error('Error parsing search results:', error);
      searchResults = [];
    }

    if (!searchResults.length) {
      console.log(`No Trustpilot pages found for ${clientName}`);
      return new Response(
        JSON.stringify({ complaints: [], hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the URL with the most reviews and add sorting parameter
    const mostReviewedResult = searchResults[0];
    console.log(`Selected company with most reviews: ${mostReviewedResult.companyName} (${mostReviewedResult.reviewCount} reviews)`);
    const baseUrl = mostReviewedResult.url;
    const mostReviewedPage = `${baseUrl}?sort=recency&page=${page}`;
    console.log(`Selected most reviewed page with sorting: ${mostReviewedPage}`);

    // Step 2: Scrape reviews from the selected page
    const scrapePrompt = `
      Visit this Trustpilot URL: ${mostReviewedPage}
      Find and extract negative customer reviews (1-2 stars) about ${mostReviewedResult.companyName}.
      The reviews are already sorted by most recent.
      For each review:
      1. Extract the complete review text
      2. Get the exact review date
      3. Categorize the review (e.g., "Customer Service", "Product Quality", etc.)
      4. Get the star rating (1-5)
      
      Return the data as a JSON array with objects containing:
      {
        "text": "the complete review text",
        "date": "date in ISO format",
        "category": "review category",
        "rating": number
      }
      
      Also check if there's a "Next" button enabled, indicating more pages.
      Add a field at the end of the JSON array: { "hasNextPage": true/false }
      
      Important:
      - Focus on negative reviews (1-2 stars)
      - Include full review text
      - Return valid JSON array only
      - If you can't access the page, return []
    `;

    console.log('Sending scrape prompt to Gemini');
    const reviewsJson = await makeGeminiRequest(scrapePrompt, GEMINI_API_KEY);
    let reviews = [];
    let hasNextPage = false;
    
    try {
      const parsedData = JSON.parse(reviewsJson);
      // Remove the hasNextPage field from the array and store it
      hasNextPage = parsedData.find((item: any) => 'hasNextPage' in item)?.hasNextPage || false;
      reviews = parsedData.filter((item: any) => !('hasNextPage' in item));
    } catch (error) {
      console.error('Error parsing reviews JSON:', error);
      reviews = [];
    }
    
    console.log(`Parsed ${reviews.length} reviews, hasNextPage: ${hasNextPage}`);

    const complaints = [];
    for (const review of reviews) {
      try {
        const { data: insertedComplaint, error: insertError } = await supabaseAdmin
          .from('complaints')
          .insert({
            project_id: projectId,
            complaint_text: review.text,
            source_url: mostReviewedPage,
            theme: review.category || 'Trustpilot Review',
            trend: review.rating <= 2 ? 'Negative' : 'Neutral',
            created_at: review.date ? new Date(review.date).toISOString() : new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error storing complaint:', insertError);
        } else {
          complaints.push({
            source_url: mostReviewedPage,
            complaint_text: review.text,
            category: review.category || 'Trustpilot Review',
            date: review.date || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error processing review:', error);
      }
    }

    console.log(`Returning ${complaints.length} complaints for page ${page}`);
    return new Response(
      JSON.stringify({
        complaints,
        hasMore: hasNextPage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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