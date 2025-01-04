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
    // Instead of sending all data, just send a sample
    sampleData: Object.entries(numericalData).reduce((acc, [key, values]) => {
      // Take only first 100 values to reduce token usage
      acc[key] = values.slice(0, 100);
      return acc;
    }, {} as Record<string, number[]>)
  };

  const prompt = `You are a statistical analysis assistant. Analyze this dataset and provide comprehensive ANOVA test results.

CRITICAL: Your response must be a VALID JSON object with NO comments, NO markdown formatting, and NO explanations.
The response must be parseable by JSON.parse() without any preprocessing.

Required JSON structure:
{
  "anova": {
    "results": [
      {
        "variable": "string",
        "comparedWith": "string",
        "fStatistic": number,
        "pValue": number,
        "effectSize": number,
        "interpretation": "string",
        "significanceLevel": "string"
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

Dataset Summary: ${JSON.stringify(dataSummary)}`;

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
      
      // Check for rate limit error
      if (errorText.includes('rate_limit_error')) {
        throw new Error('Rate limit exceeded. Please try again in a minute.');
      }
      
      throw new Error(`Failed to get Claude analysis: ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude response received');

    let responseText = claudeData.content[0].text.trim();
    console.log('Raw Claude response:', responseText);

    // Try to find JSON content within the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in Claude response');
    }

    responseText = jsonMatch[0];
    console.log('Extracted JSON:', responseText);

    try {
      const analysis = JSON.parse(responseText);
      
      // Validate the analysis structure
      if (!analysis.anova || !Array.isArray(analysis.anova.results)) {
        console.error('Invalid analysis structure:', analysis);
        throw new Error('Invalid analysis structure');
      }

      // Validate each result
      analysis.anova.results.forEach((result: any, index: number) => {
        const requiredFields = [
          'variable',
          'comparedWith',
          'fStatistic',
          'pValue',
          'effectSize',
          'interpretation',
          'significanceLevel'
        ];

        const missingFields = requiredFields.filter(field => {
          const value = result[field];
          return value === undefined || value === null || 
                 (typeof value === 'number' && isNaN(value));
        });

        if (missingFields.length > 0) {
          console.error(`Result at index ${index} is missing fields:`, missingFields);
          console.error('Result:', result);
          throw new Error(`Missing or invalid fields in ANOVA result: ${missingFields.join(', ')}`);
        }
      });

      return analysis;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Response that failed to parse:', responseText);
      throw new Error(`Failed to parse Claude response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in Claude analysis:', error);
    throw error;
  }
}