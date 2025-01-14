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

    // Construct query specifically for Trustpilot
    const query = `site:trustpilot.com ${clientName} reviews`
    console.log(`Searching with query: ${query}`)
    
    const baseUrl = 'https://api.jina.ai/v1/search'
    
    // Test API key with a simple search request
    const testResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        mode: 'web',
        query: 'test',
        limit: 1
      })
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Jina AI API key validation failed:', errorText);
      throw new Error(`Invalid Jina AI API key: ${errorText}`);
    }

    console.log('Jina AI API key validated successfully');
    
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        mode: 'web',
        query: query,
        limit: resultsPerPage,
        offset: startIndex
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response from Jina AI:', errorText)
      throw new Error(`Jina AI API returned status ${response.status}: ${errorText}`)
    }

    const results = await response.json()
    console.log('Raw Jina AI response:', JSON.stringify(results))

    // Process and store complaints
    if (results.data && Array.isArray(results.data)) {
      for (const result of results.data) {
        if (!result.text && !result.content) {
          console.log('Skipping result with no text content:', result)
          continue
        }

        const complaintText = result.text || result.content || result.snippet || ''
        if (!complaintText.trim()) {
          console.log('Skipping empty text result:', result)
          continue
        }

        const complaint: ComplaintData = {
          source_url: result.url || 'Trustpilot',
          complaint_text: complaintText,
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
    } else {
      console.log('No data array in results:', results)
    }

    console.log(`Successfully processed ${complaints.length} complaints`)

    return new Response(
      JSON.stringify({ 
        complaints,
        message: `Successfully scraped ${complaints.length} complaints from page ${page}`,
        hasMore: results.data?.length === resultsPerPage
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