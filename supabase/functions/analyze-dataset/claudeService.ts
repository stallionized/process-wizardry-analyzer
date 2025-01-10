import { DescriptiveStats } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function getClaudeAnalysis(prompt: string) {
  console.log('Starting Claude analysis');
  
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    console.error('Missing ANTHROPIC_API_KEY');
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  try {
    console.log('Sending request to Claude API');
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Failed to get Claude analysis: ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    if (!claudeData?.content?.[0]?.text) {
      console.error('Invalid Claude response structure:', claudeData);
      throw new Error('Invalid response from Claude API');
    }

    const responseText = claudeData.content[0].text.trim();
    console.log('Received response from Claude:', responseText.substring(0, 100) + '...');
    
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON object found in Claude response');
        throw new Error('No JSON object found in Claude response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed Claude response');
      
      return parsedResponse;
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      throw new Error('Failed to parse Claude response: ' + error.message);
    }
  } catch (error) {
    console.error('Error in Claude analysis:', error);
    throw error;
  }
}