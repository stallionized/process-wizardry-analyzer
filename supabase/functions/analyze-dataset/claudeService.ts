import { chunkData, processChunkData } from './utils/dataChunking.ts';
import { generateAllPossiblePairs, mergeAnalyses } from './utils/analysisUtils.ts';
import { DescriptiveStats } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function analyzeChunk(
  chunk: Record<string, number[]>, 
  variablePairs: [string, string][], 
  retryCount = 0
): Promise<any> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 61000;

  try {
    const processedChunk = processChunkData(chunk);
    
    const dataSummary = {
      variablePairs,
      sampleSize: Object.values(processedChunk)[0]?.length || 0,
      data: processedChunk
    };

    const prompt = `You are a statistical analysis assistant specializing in ANOVA and post-hoc testing.
Analyze this dataset chunk and provide comprehensive one-way ANOVA results for ALL possible variable pairs provided.
For each variable pair, determine if there's a significant relationship and provide appropriate visualizations.
Include post-hoc tests for significant ANOVA results.

Important instructions:
1. Analyze EVERY variable pair provided in the variablePairs array
2. For each pair, treat one variable as the independent variable and the other as dependent
3. Calculate F-statistic, p-value, and effect size for each comparison
4. Provide detailed interpretation for each test
5. Include visualizations that help understand the relationships
6. Run post-hoc tests for any significant results

Return ONLY valid JSON matching this structure:
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
        "significanceLevel": "string",
        "postHocResults": [
          {
            "group1": "string",
            "group2": "string",
            "meanDifference": number,
            "pValue": number,
            "significant": boolean,
            "interpretation": "string"
          }
        ],
        "visualizations": [
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
    ],
    "summary": "string"
  }
}

Dataset: ${JSON.stringify(dataSummary)}`;

    console.log(`Analyzing chunk with ${dataSummary.sampleSize} samples and ${variablePairs.length} variable pairs`);

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
        return analyzeChunk(chunk, variablePairs, retryCount + 1);
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
      
      if (!parsedResponse.anova || !Array.isArray(parsedResponse.anova.results)) {
        throw new Error('Invalid analysis structure in response');
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
      return analyzeChunk(chunk, variablePairs, retryCount + 1);
    }
    throw error;
  }
}

export async function getClaudeAnalysis(
  descriptiveStats: Record<string, DescriptiveStats>,
  numericalData: Record<string, number[]>
): Promise<any> {
  console.log('Starting comprehensive ANOVA analysis of dataset');
  
  const variables = Object.keys(numericalData);
  const variablePairs = generateAllPossiblePairs(variables);
  
  console.log(`Generated ${variablePairs.length} variable pairs for analysis`);
  
  const chunks = chunkData(numericalData);
  const analyses: any[] = [];
  
  console.log(`Processing ${chunks.length} chunks of data`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      console.log(`Analyzing chunk ${i + 1}/${chunks.length}`);
      const analysis = await analyzeChunk(chunks[i], variablePairs);
      
      if (analysis && analysis.anova) {
        analyses.push(analysis);
        console.log(`Successfully analyzed chunk ${i + 1}`);
      }
      
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error analyzing chunk ${i + 1}:`, error);
    }
  }

  if (analyses.length === 0) {
    throw new Error('Failed to analyze any chunks of the dataset');
  }

  console.log(`Successfully analyzed ${analyses.length}/${chunks.length} chunks`);
  return mergeAnalyses(analyses);
}