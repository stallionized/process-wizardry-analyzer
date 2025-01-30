import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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
    console.log('Generating content for topic:', topic, 'with keywords:', seoKeywords);

    const systemPrompt = `You are an expert blog writer focused on creating SEO-friendly, engaging content. 
    Your task is to write comprehensive, well-structured blog posts that are both informative and optimized for search engines.
    
    First, provide a clear, concise 3-sentence summary of the blog post that captures its main points and value proposition.
    Then, after two blank lines, write the full blog post.
    
    Guidelines for the summary:
    - Exactly 3 sentences
    - No special characters or formatting
    - Focus on the key value proposition and main points
    - Keep it engaging but straightforward
    
    Guidelines for the blog post:
    - Create clear, hierarchical headings using proper markdown (## for H2, ### for H3)
    - Write engaging, detailed content under each section
    - Naturally incorporate SEO keywords when provided
    - Use proper formatting for emphasis (bold for important points)
    - Ensure content is factual and well-researched
    - Use a professional yet conversational tone
    - Include a compelling introduction and conclusion
    - Break up text into readable paragraphs
    - Aim for at least 800 words of high-quality content
    - Make the content inspiring and influential`

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
        model: 'gpt-4o',
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error('Failed to generate content');
    }

    const data = await response.json()
    console.log('OpenAI response received');
    
    const generatedContent = data.choices[0].message.content
    console.log('Generated content length:', generatedContent.length);

    // Split content into summary and main content
    const parts = generatedContent.split('\n\n')
    const summary = parts[0].replace(/[^\w\s.,!?]/g, '').trim() // Remove special characters
    const content = parts.slice(2).join('\n\n') // Skip the two blank lines

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