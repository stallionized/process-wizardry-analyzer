import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileUrl, projectId } = await req.json()

    // Download file content from Supabase Storage
    const response = await fetch(fileUrl)
    const fileContent = await response.text()

    // Initialize OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a data analysis assistant. You will:
              1. Read the dataset
              2. Convert any text columns to numerical representations
              3. Calculate a Pearson Correlation Matrix
              4. Return the results in a specific JSON format`
          },
          {
            role: 'user',
            content: `Analyze this dataset and return a JSON object with:
              1. The processed dataset with text columns converted to numerical values
              2. The correlation matrix
              3. A mapping of text values to numbers for each converted column
              
              Dataset:
              ${fileContent}`
          }
        ],
      }),
    })

    const gptResult = await openaiResponse.json()
    const analysis = JSON.parse(gptResult.choices[0].message.content)

    // Save results to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        project_id: projectId,
        results: analysis,
        created_at: new Date().toISOString()
      })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})