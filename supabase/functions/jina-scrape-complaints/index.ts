import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeRequest {
  clientName: string;
  projectId: string;
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
    const { clientName, projectId } = await req.json() as ScrapeRequest
    console.log(`Starting scrape for client: ${clientName}, project: ${projectId}`)

    if (!clientName || !projectId) {
      throw new Error('Client name and project ID are required')
    }

    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    if (!JINA_API_KEY) {
      throw new Error('JINA_API_KEY is not configured')
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Define search queries for different platforms
    const platforms = [
      'Better Business Bureau',
      'Trustpilot',
      'Yelp',
      'PissedConsumer'
    ]

    const complaints: ComplaintData[] = []

    // Use Jina AI to search and extract complaints from each platform
    for (const platform of platforms) {
      const query = `${clientName} complaints reviews ${platform}`
      console.log(`Searching ${platform} for: ${query}`)
      
      const response = await fetch('https://api.jina.ai/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          top_k: 5, // Get top 5 results per platform
          filter: {
            domain: platform.toLowerCase()
          }
        })
      })

      if (!response.ok) {
        console.error(`Error searching ${platform}:`, await response.text())
        continue
      }

      const results = await response.json()
      console.log(`Got ${results.data?.length || 0} results from ${platform}`)

      // Process and store complaints
      for (const result of (results.data || [])) {
        const complaint: ComplaintData = {
          source_url: result.url || platform,
          complaint_text: result.text || result.snippet || '',
          category: platform,
          date: new Date().toISOString() // Using current date as fallback
        }

        if (complaint.complaint_text) {
          complaints.push(complaint)
          
          // Store in database
          const { error } = await supabaseAdmin
            .from('complaints')
            .insert({
              project_id: projectId,
              complaint_text: complaint.complaint_text,
              source_url: complaint.source_url,
              theme: complaint.category,
              trend: 'neutral'
            })

          if (error) {
            console.error('Error storing complaint:', error)
          }
        }
      }
    }

    console.log(`Scraped ${complaints.length} total complaints`)

    return new Response(
      JSON.stringify({ 
        complaints,
        message: `Successfully scraped ${complaints.length} complaints`
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