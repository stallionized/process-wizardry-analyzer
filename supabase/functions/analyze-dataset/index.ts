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
    console.log('Processing analysis for project:', projectId)
    console.log('File URL:', fileUrl)

    // Download file content from Supabase Storage
    const response = await fetch(fileUrl)
    const fileContent = await response.text()
    console.log('File content loaded successfully')

    // Initialize OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a data analysis assistant. Analyze the provided dataset and return a JSON object with:
              1. A correlation matrix showing relationships between numerical variables
              2. Mappings of any text values to numerical representations
              
              The response must be a valid JSON object with exactly this structure:
              {
                "correlationMatrix": {
                  "variable1": {
                    "variable2": number,
                    ...
                  },
                  ...
                },
                "mappings": {
                  "columnName": {
                    "textValue": number,
                    ...
                  },
                  ...
                }
              }`
          },
          {
            role: 'user',
            content: `Analyze this dataset and return the JSON object as specified:
              
              ${fileContent}`
          }
        ],
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData}`)
    }

    const gptResult = await openaiResponse.json()
    console.log('OpenAI response received:', gptResult)

    if (!gptResult.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI')
    }

    const analysis = JSON.parse(gptResult.choices[0].message.content)
    console.log('Parsed analysis:', analysis)

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

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-dataset function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})