import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { clientName, projectId, page = 1 } = await req.json()
    console.log(`Starting Jina scrape for client: ${clientName}, project: ${projectId}, page: ${page}`)

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required')
    }

    // First search for the company on Trustpilot
    const searchUrl = `https://www.trustpilot.com/search?query=${encodeURIComponent(clientName)}`
    console.log('Searching Trustpilot at:', searchUrl)

    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    if (!JINA_API_KEY) {
      throw new Error('JINA_API_KEY is not configured')
    }

    // Get search results with proper headers and error handling
    let searchResponse
    try {
      searchResponse = await fetch('https://reader.jina.ai/api/reader', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: searchUrl,
          mode: 'article',
          wait_for_selector: '.styles_businessTitle__2Eet1',
          javascript: true
        })
      })
    } catch (error) {
      console.error('Network error when calling Jina API:', error)
      throw new Error(`Failed to connect to Jina API: ${error.message}`)
    }

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('Error from Jina AI search:', errorText)
      throw new Error(`Jina AI API returned status ${searchResponse.status}: ${errorText}`)
    }

    const searchResults = await searchResponse.json()
    console.log('Search results HTML length:', searchResults.text?.length || 0)

    if (!searchResults.text) {
      throw new Error('No content returned from Jina API')
    }

    // Parse the search results to find company links
    const parser = new DOMParser()
    const searchDoc = parser.parseFromString(searchResults.text, 'text/html')
    
    if (!searchDoc) {
      throw new Error('Failed to parse search results HTML')
    }

    // Find all business cards/links in search results
    const businessCards = searchDoc.querySelectorAll('a[href^="/review/"]')
    console.log(`Found ${businessCards.length} business results`)

    if (businessCards.length === 0) {
      return new Response(
        JSON.stringify({
          complaints: [],
          hasMore: false,
          message: 'No companies found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the business card with the most reviews
    let bestMatch = null
    let maxReviews = -1

    for (const card of businessCards) {
      const reviewCountText = card.textContent?.match(/\d+\s+reviews?/)?.[0] || ''
      const reviewCount = parseInt(reviewCountText.match(/\d+/)?.[0] || '0')
      console.log(`Found card with ${reviewCount} reviews`)
      
      if (reviewCount > maxReviews) {
        maxReviews = reviewCount
        bestMatch = card
      }
    }

    if (!bestMatch) {
      throw new Error('Could not find a valid company profile')
    }

    // Get the company profile URL
    const companyPath = bestMatch.getAttribute('href')
    console.log('Best match company path:', companyPath)
    
    const reviewsUrl = `https://www.trustpilot.com${companyPath}?page=${page}`
    console.log('Fetching reviews from:', reviewsUrl)

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Use Jina to get the reviews page
    let response
    try {
      response = await fetch('https://reader.jina.ai/api/reader', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: reviewsUrl,
          mode: 'article',
          wait_for_selector: '.styles_reviewContent__0Q2Tg',
          javascript: true
        })
      })
    } catch (error) {
      console.error('Network error when fetching reviews:', error)
      throw new Error(`Failed to fetch reviews: ${error.message}`)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error from Jina AI reviews:', errorText)
      throw new Error(`Jina AI API returned status ${response.status} when fetching reviews: ${errorText}`)
    }

    const results = await response.json()
    console.log('Raw Jina AI response length:', results.text?.length || 0)

    if (!results.text) {
      throw new Error('No review content returned from Jina API')
    }

    const complaints = []
    const resultsPerPage = 10
    const startIndex = (page - 1) * resultsPerPage

    // Process the extracted content
    // Split the content into reviews using Trustpilot's review content class
    const reviewPattern = /(?:★{1,5}|⭐{1,5})\s*([\s\S]*?)(?=(?:★{1,5}|⭐{1,5})|$)/g
    const reviews = results.text.match(reviewPattern) || []
    console.log(`Found ${reviews.length} reviews in content`)
    
    // Process each review segment
    for (const reviewText of reviews.slice(startIndex, startIndex + resultsPerPage)) {
      if (!reviewText.trim()) continue

      // Extract star rating from review text
      const stars = (reviewText.match(/★|⭐/g) || []).length
      if (stars > 2) continue // Skip positive reviews (3+ stars)

      const complaint = {
        source_url: reviewsUrl,
        complaint_text: reviewText.replace(/[★⭐]/g, '').trim(),
        category: 'Trustpilot Review',
        date: new Date().toISOString()
      }

      complaints.push(complaint)
      
      // Store in database
      const { error: insertError } = await supabaseAdmin
        .from('complaints')
        .insert({
          project_id: projectId,
          complaint_text: complaint.complaint_text,
          source_url: complaint.source_url,
          theme: complaint.category,
          trend: 'Negative'
        })

      if (insertError) {
        console.error('Error storing complaint:', insertError)
      }
    }

    console.log(`Successfully processed ${complaints.length} complaints`)

    return new Response(
      JSON.stringify({ 
        complaints,
        hasMore: complaints.length === resultsPerPage
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Scraping error:', error)
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
    )
  }
})