import { chunkData, processChunkData } from './utils/dataChunking.ts';
import { generateAllPossiblePairs, mergeAnalyses } from './utils/analysisUtils.ts';
import { DescriptiveStats } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function analyzeControlCharts(
  chunk: Record<string, number[]>,
  retryCount = 0
): Promise<any> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 61000;

  try {
    const processedChunk = processChunkData(chunk);
    
    const dataSummary = {
      sampleSize: Object.values(processedChunk)[0]?.length || 0,
      data: processedChunk
    };

    const prompt = `You are a statistical process control expert specializing in control charts.
Analyze this dataset and generate all possible control charts for monitoring and process control.

Important instructions:
1. For each numerical variable, create appropriate control charts (X-bar, R, S, Individual, Moving Range, etc.)
2. Calculate control limits using ±3 standard deviations
3. Identify out-of-control points and their specific values
4. Group out-of-control points by their standard deviation ranges (e.g., > 3σ, < -3σ, etc.)
5. Provide interpretation for each control chart
6. Include visualization data for plotting

Return ONLY valid JSON matching this structure:
{
  "controlCharts": [
    {
      "variable": "string",
      "chartType": "string",
      "centerLine": number,
      "upperControlLimit": number,
      "lowerControlLimit": number,
      "data": [
        {
          "index": number,
          "value": number,
          "isOutOfControl": boolean,
          "deviationLevel": number
        }
      ],
      "outOfControlPoints": {
        "ranges": [
          {
            "min": number,
            "max": number,
            "volume": number,
            "values": number[]
          }
        ]
      },
      "interpretation": "string"
    }
  ],
  "summary": "string"
}

Dataset: ${JSON.stringify(dataSummary)}`;

    console.log(`Analyzing control charts for ${dataSummary.sampleSize} samples`);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
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
      
      if (errorText.includes('rate_limit_error') && retryCount < MAX_RETRIES) {
        console.log(`Rate limit hit, retry ${retryCount + 1}/${MAX_RETRIES} after ${RETRY_DELAY}ms`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return analyzeControlCharts(chunk, retryCount + 1);
      }
      
      throw new Error(`Failed to get Claude analysis: ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content[0].text.trim();
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in Claude response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      if (!parsedResponse.controlCharts || !Array.isArray(parsedResponse.controlCharts)) {
        throw new Error('Invalid control charts structure in response');
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      throw error;
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Error occurred, retry ${retryCount + 1}/${MAX_RETRIES} after delay`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return analyzeControlCharts(chunk, retryCount + 1);
    }
    throw error;
  }
}

export async function getClaudeAnalysis(
  descriptiveStats: Record<string, DescriptiveStats>,
  numericalData: Record<string, number[]>
): Promise<any> {
  console.log('Starting comprehensive analysis of dataset');
  
  const chunks = chunkData(numericalData);
  const controlChartAnalyses: any[] = [];
  
  console.log(`Processing ${chunks.length} chunks of data`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      console.log(`Analyzing chunk ${i + 1}/${chunks.length}`);
      const analysis = await analyzeControlCharts(chunks[i]);
      
      if (analysis && analysis.controlCharts) {
        controlChartAnalyses.push(analysis);
        console.log(`Successfully analyzed chunk ${i + 1}`);
      }
      
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error analyzing chunk ${i + 1}:`, error);
    }
  }

  if (controlChartAnalyses.length === 0) {
    throw new Error('Failed to analyze any chunks of the dataset');
  }

  console.log(`Successfully analyzed ${controlChartAnalyses.length}/${chunks.length} chunks`);
  
  // Merge all control chart analyses
  const mergedAnalysis = {
    controlCharts: controlChartAnalyses.flatMap(analysis => analysis.controlCharts),
    summary: controlChartAnalyses[0].summary
  };

  return mergedAnalysis;
}