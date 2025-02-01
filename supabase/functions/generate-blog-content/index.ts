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
    
    For the summary:
    - Extract 2-3 sentences from the introduction that best capture the main points
    - The summary should give readers a clear idea of what they'll learn
    - Keep it concise but informative (around 50-75 words)
    - Make it engaging to encourage readers to continue reading`

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
        model: 'gpt-4',
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

    // Split the content to separate the summary and main content
    const paragraphs = generatedContent.split('\n\n')
    const firstParagraph = paragraphs[0]
    
    // Extract 2-3 sentences for the summary
    const sentences = firstParagraph.split(/[.!?]+\s+/)
    const summary = sentences.slice(0, 3).join('. ') + '.'
    
    // Join the rest of the paragraphs for the main content
    const content = paragraphs.join('\n\n')

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