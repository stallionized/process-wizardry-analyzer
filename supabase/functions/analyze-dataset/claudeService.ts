import { DescriptiveStats } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function chunkData(data: Record<string, number[]>, chunkSize: number = 1000) {
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

async function analyzeChunk(chunk: Record<string, number[]>, variables: string[]) {
  const dataSummary = {
    variables,
    sampleData: chunk,
    dataPoints: Object.values(chunk)[0]?.length || 0
  };

  const prompt = `You are a statistical analysis assistant. Analyze this dataset chunk and provide ANOVA test results.
Your response must be valid JSON with this structure:
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

Dataset Chunk: ${JSON.stringify(dataSummary)}`;

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
    
    if (errorText.includes('rate_limit_error')) {
      // Wait for 1 minute before retrying
      await new Promise(resolve => setTimeout(resolve, 61000));
      return analyzeChunk(chunk, variables);
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
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    throw error;
  }
}

function mergeAnalyses(analyses: any[]) {
  if (analyses.length === 0) return null;
  
  const merged = {
    anova: {
      results: [] as any[],
      summary: '',
      charts: [] as any[]
    }
  };

  // Combine results and average the statistics
  const resultMap = new Map();
  analyses.forEach(analysis => {
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

  // Calculate averages
  resultMap.forEach(result => {
    merged.anova.results.push({
      ...result,
      fStatistic: result.fStatistic / result.count,
      pValue: result.pValue / result.count,
      effectSize: result.effectSize / result.count
    });
  });

  // Use the most comprehensive charts
  const maxCharts = Math.max(...analyses.map(a => a.anova.charts.length));
  const analysisWithMostCharts = analyses.find(a => a.anova.charts.length === maxCharts);
  merged.anova.charts = analysisWithMostCharts?.anova.charts || [];

  // Combine summaries
  merged.anova.summary = analyses
    .map(a => a.anova.summary)
    .filter((summary, index, self) => self.indexOf(summary) === index)
    .join(' ');

  return merged;
}

export async function getClaudeAnalysis(
  descriptiveStats: Record<string, DescriptiveStats>,
  numericalData: Record<string, number[]>
): Promise<any> {
  console.log('Starting analysis of large dataset');
  
  const chunks = chunkData(numericalData);
  const variables = Object.keys(numericalData);
  const analyses: any[] = [];
  
  console.log(`Processing ${chunks.length} chunks of data`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      console.log(`Analyzing chunk ${i + 1}/${chunks.length}`);
      const analysis = await analyzeChunk(chunks[i], variables);
      analyses.push(analysis);
      
      // Wait between chunks to avoid rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error analyzing chunk ${i + 1}:`, error);
      // Continue with other chunks even if one fails
    }
  }

  if (analyses.length === 0) {
    throw new Error('Failed to analyze any chunks of the dataset');
  }

  console.log('Merging analyses from all chunks');
  return mergeAnalyses(analyses);
}