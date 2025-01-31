import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { topic, seoKeywords } = await req.json()

    const systemPrompt = `You are an expert blog writer focused on creating SEO-friendly, engaging content. 
    Your task is to write comprehensive, well-structured blog posts that are both informative and optimized for search engines.
    
    Guidelines:
    - Create clear section headings without using markdown symbols
    - Write engaging, detailed content under each section
    - Naturally incorporate SEO keywords when provided
    - Use proper HTML formatting for emphasis (<strong> for important points)
    - Ensure content is factual and well-researched
    - Use a professional yet conversational tone
    - Include a compelling introduction and conclusion
    - Break up text into readable paragraphs
    - Remove any unnecessary special characters
    
    IMPORTANT: Start your response with a 2-3 sentence summary of the entire blog post. This summary should:
    - Provide a clear overview of what the reader will learn
    - Include the main value proposition or key takeaway
    - Be engaging and make readers want to continue reading
    - Be approximately 50-75 words long
    
    After the summary, add two line breaks before starting the main blog content.`

    const userPrompt = seoKeywords 
      ? `Write a comprehensive blog post about: ${topic}
         Please naturally incorporate these SEO keywords throughout the content: ${seoKeywords}`
      : `Write a comprehensive blog post about: ${topic}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    let generatedContent = data.choices[0].message.content

    // Clean up markdown headers and formatting
    generatedContent = generatedContent
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\*\*/g, '<strong>') // Convert **text** to <strong>text</strong>
      .replace(/\*\*/g, '</strong>')
      .trim()

    // Split content into summary and main content
    const parts = generatedContent.split('\n\n')
    const summary = parts[0].trim()
    const content = parts.slice(1).join('\n\n').trim()

    console.log('Generated Summary:', summary)
    console.log('Content length:', content.length)

    return new Response(
      JSON.stringify({ content, summary }),
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