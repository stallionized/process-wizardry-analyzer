import { DescriptiveStats } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function chunkData(data: Record<string, number[]>, chunkSize: number = 500) {
  const totalLength = Object.values(data)[0]?.length || 0;
  const chunks: Array<Record<string, number[]>> = [];
  
  for (let i = 0; i < totalLength; i += chunkSize) {
    const chunk: Record<string, number[]> = {};
    Object.entries(data).forEach(([key, values]) => {
      chunk[key] = values.slice(i, i + chunkSize);
    });
    chunks.push(chunk);
  }
  
  return chunks;
}

async function analyzeChunk(chunk: Record<string, number[]>, variables: string[], retryCount = 0): Promise<any> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 61000;

  try {
    const processedChunk: Record<string, number[]> = {};
    Object.entries(chunk).forEach(([key, values]) => {
      processedChunk[key] = values.map(v => Number(v.toFixed(2)));
    });

    const dataSummary = {
      variables,
      sampleSize: Object.values(processedChunk)[0]?.length || 0,
      data: processedChunk
    };

    const prompt = `You are a statistical analysis assistant specializing in ANOVA and post-hoc testing.
Analyze this dataset chunk and provide comprehensive ANOVA results including post-hoc tests where relevant.
For each variable pair, determine if there's a significant relationship and provide appropriate visualizations.
Include post-hoc tests for significant ANOVA results.

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
        "isSignificant": boolean,
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

    console.log(`Analyzing chunk with ${dataSummary.sampleSize} samples`);

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
        return analyzeChunk(chunk, variables, retryCount + 1);
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
      return analyzeChunk(chunk, variables, retryCount + 1);
    }
    throw error;
  }
}

function mergeAnalyses(analyses: any[]) {
  if (analyses.length === 0) return null;
  
  const merged = {
    anova: {
      results: [] as any[],
      summary: '',
    }
  };

  const resultMap = new Map();

  analyses.forEach(analysis => {
    if (!analysis?.anova?.results) return;
    
    analysis.anova.results.forEach((result: any) => {
      const key = `${result.variable}-${result.comparedWith}`;
      if (!resultMap.has(key)) {
        resultMap.set(key, {
          ...result,
          fStatistic: 0,
          pValue: 0,
          effectSize: 0,
          count: 0
        });
      }
      
      const existing = resultMap.get(key);
      existing.fStatistic += result.fStatistic;
      existing.pValue += result.pValue;
      existing.effectSize += result.effectSize;
      existing.count += 1;
    });
  });

  resultMap.forEach(result => {
    if (result.count > 0) {
      merged.anova.results.push({
        ...result,
        fStatistic: result.fStatistic / result.count,
        pValue: result.pValue / result.count,
        effectSize: result.effectSize / result.count
      });
    }
  });

  const uniqueSummaries = analyses
    .map(a => a.anova.summary)
    .filter((summary): summary is string => typeof summary === 'string')
    .filter((summary, index, self) => self.indexOf(summary) === index);
  
  merged.anova.summary = uniqueSummaries.join(' ');

  return merged;
}

export async function getClaudeAnalysis(
  descriptiveStats: Record<string, DescriptiveStats>,
  numericalData: Record<string, number[]>
): Promise<any> {
  console.log('Starting comprehensive ANOVA analysis of dataset');
  
  const chunks = chunkData(numericalData);
  const variables = Object.keys(numericalData);
  const analyses: any[] = [];
  
  console.log(`Processing ${chunks.length} chunks of data`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      console.log(`Analyzing chunk ${i + 1}/${chunks.length}`);
      const analysis = await analyzeChunk(chunks[i], variables);
      
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