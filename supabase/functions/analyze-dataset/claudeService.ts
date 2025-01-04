import { DescriptiveStats } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function getClaudeAnalysis(
  descriptiveStats: Record<string, DescriptiveStats>,
  numericalData: Record<string, number[]>
): Promise<any> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  // Create a minimal data summary to reduce tokens
  const dataSummary = {
    variables: Object.keys(numericalData),
    stats: Object.entries(descriptiveStats).reduce((acc, [key, stats]) => {
      acc[key] = {
        mean: Number(stats.mean.toFixed(2)),
        stdDev: Number(stats.stdDev.toFixed(2)),
        min: Number(stats.min.toFixed(2)),
        max: Number(stats.max.toFixed(2))
      };
      return acc;
    }, {} as Record<string, Partial<DescriptiveStats>>),
    sampleCount: Object.values(numericalData)[0]?.length || 0
  };

  // Simplified prompt to reduce token count
  const prompt = `Analyze this dataset and provide statistical insights. Return ONLY a JSON object with this structure:
{
  "anova": {
    "results": [
      {
        "variable": "string",
        "fStatistic": number,
        "pValue": number,
        "interpretation": "string"
      }
    ],
    "summary": "string",
    "charts": [
      {
        "type": "string",
        "title": "string",
        "data": [],
        "xKey": "string",
        "yKeys": ["string"],
        "description": "string"
      }
    ]
  }
}

Dataset: ${JSON.stringify(dataSummary)}`;

  console.log('Sending request to Claude with prompt length:', prompt.length);

  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2048, // Reduced from 4096
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
    console.log('Claude response received');

    const responseText = claudeData.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    if (!analysis.anova || !Array.isArray(analysis.anova.results)) {
      throw new Error('Invalid analysis structure');
    }

    return analysis;
  } catch (error) {
    console.error('Error in Claude analysis:', error);
    throw error;
  }
}