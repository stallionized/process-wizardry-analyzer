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
    sampleCount: Object.values(numericalData)[0]?.length || 0,
    rawData: numericalData
  };

  // Updated prompt to be more explicit about JSON formatting
  const prompt = `You are a statistical analysis assistant. Analyze this dataset and provide comprehensive ANOVA test results.

Your response must be ONLY a valid JSON object without any markdown formatting or additional text.

For each numerical variable in the dataset:
1. Perform one-way ANOVA tests comparing it against all other variables
2. Calculate effect sizes (eta-squared)
3. Determine significance levels (*, **, ***, ns)
4. Provide clear interpretations

The JSON response must follow this exact structure (do not include any markdown or code block formatting):
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
    console.log('Claude response received');

    // Extract just the content from Claude's response
    const responseText = claudeData.content[0].text.trim();
    console.log('Raw Claude response:', responseText);

    try {
      // Remove any potential markdown formatting
      const cleanedResponse = responseText.replace(/```json\n|\n```/g, '');
      const analysis = JSON.parse(cleanedResponse);
      
      // Validate the analysis structure
      if (!analysis.anova || !Array.isArray(analysis.anova.results)) {
        throw new Error('Invalid analysis structure');
      }

      // Ensure all required fields are present in each result
      analysis.anova.results.forEach((result: any) => {
        if (!result.variable || !result.comparedWith || 
            typeof result.fStatistic !== 'number' || 
            typeof result.pValue !== 'number' || 
            typeof result.effectSize !== 'number' || 
            !result.interpretation || !result.significanceLevel) {
          throw new Error('Missing required fields in ANOVA results');
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