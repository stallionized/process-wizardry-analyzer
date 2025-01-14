import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    if (!JINA_API_KEY) {
      throw new Error('JINA_API_KEY is not configured')
    }

    console.log('JINA_API_KEY is configured, proceeding with API call')

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
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Construct Trustpilot URL
    const searchUrl = `https://www.trustpilot.com/review/${formattedCompanyName}`
    console.log('Constructed Trustpilot URL:', searchUrl)
    
    // Use the correct Reader API endpoint
    const baseUrl = 'https://r.jina.ai'
    
    console.log('Making request to Jina Reader API for URL:', searchUrl)
    
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        url: searchUrl,
        mode: 'article',
        wait_for_selector: '.review-content'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response from Jina AI:', errorText)
      throw new Error(`Jina AI API returned status ${response.status}: ${errorText}`)
    }

    const results = await response.json()
    console.log('Raw Jina AI response:', JSON.stringify(results))

    // Process the extracted content
    if (results.text) {
      // Split the content into reviews using a more robust pattern
      const reviews = results.text.split(/(?=\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/).filter(Boolean)
      
      // Process each review segment
      for (const reviewText of reviews.slice(startIndex, startIndex + resultsPerPage)) {
        if (!reviewText.trim()) {
          continue
        }

        const complaint: ComplaintData = {
          source_url: searchUrl,
          complaint_text: reviewText.trim(),
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
            trend: 'neutral'
          })

        if (insertError) {
          console.error('Error storing complaint:', insertError)
        }
      }
    }

    console.log(`Successfully processed ${complaints.length} complaints`)

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