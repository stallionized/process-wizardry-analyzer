import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a Six Sigma Master Black Belt process engineer and master data scientist with over 20 years of experience. When analyzing descriptive statistics:
- Explain findings in simple terms that a fifth grader could understand
- Focus on what the numbers mean for the process
- Highlight any unusual or interesting patterns
- Avoid using special characters or unnecessary punctuation
- Keep explanations concise and clear
- Use simple analogies when helpful`;

function calculateDescriptiveStats(data: number[]) {
  const n = data.length;
  if (n === 0) return null;

  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  // Sort data for median and quartiles
  const sorted = [...data].sort((a, b) => a - b);
  const median = n % 2 === 0 
    ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
    : sorted[Math.floor(n/2)];

  // Calculate variance and standard deviation
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Calculate quartiles
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  
  // Calculate min, max, and range
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  return {
    count: n,
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    range: Number(range.toFixed(4)),
    q1: Number(q1.toFixed(4)),
    q3: Number(q3.toFixed(4))
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, projectId } = await req.json();
    console.log('Processing files:', files);
    console.log('Project ID:', projectId);

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for analysis');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const fileUrl = files[0].url;
    console.log('Downloading file from:', fileUrl);

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('File downloaded successfully');

    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    console.log('Parsed Excel data rows:', jsonData.length);

    if (jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }

    // Extract columns and prepare data
    const columns = Object.keys(jsonData[0] || {});
    const numericalData: Record<string, number[]> = {};
    const categoricalMappings: Record<string, Record<string, number>> = {};
    const descriptiveStats: Record<string, any> = {};

    // Process each column
    columns.forEach(column => {
      const values = jsonData.map(row => row[column]);
      
      const isNumerical = values.every(value => 
        typeof value === 'number' || 
        (typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^0-9.-]/g, ''))))
      );

      if (isNumerical) {
        const numericValues = values.map(value => 
          typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, ''))
        );
        numericalData[column] = numericValues;
        descriptiveStats[column] = calculateDescriptiveStats(numericValues);
      } else {
        const uniqueValues = [...new Set(values)];
        const mapping: Record<string, number> = {};
        uniqueValues.forEach((value, index) => {
          mapping[value] = index;
        });
        categoricalMappings[column] = mapping;
        numericalData[column] = values.map(value => mapping[value]);
      }
    });

    // Calculate correlation matrix
    const correlationMatrix: Record<string, Record<string, number>> = {};
    const columns2 = Object.keys(numericalData);

    columns2.forEach(col1 => {
      correlationMatrix[col1] = {};
      columns2.forEach(col2 => {
        const values1 = numericalData[col1];
        const values2 = numericalData[col2];
        
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
        
        let covariance = 0;
        let variance1 = 0;
        let variance2 = 0;
        
        for (let i = 0; i < values1.length; i++) {
          const diff1 = values1[i] - mean1;
          const diff2 = values2[i] - mean2;
          covariance += diff1 * diff2;
          variance1 += diff1 * diff1;
          variance2 += diff2 * diff2;
        }
        
        const correlation = covariance / Math.sqrt(variance1 * variance2);
        correlationMatrix[col1][col2] = Number(correlation.toFixed(4));
      });
    });

    // Get AI analysis of descriptive statistics
    const statsPrompt = `Please analyze these descriptive statistics and provide a simple summary that a fifth grader could understand. Focus on key patterns and interesting findings: ${JSON.stringify(descriptiveStats)}`;
    
    const statsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: statsPrompt }
        ],
      }),
    });

    if (!statsResponse.ok) {
      throw new Error('Failed to get AI analysis of descriptive statistics');
    }

    const statsAiData = await statsResponse.json();
    const statsAnalysis = statsAiData.choices[0].message.content;

    // Get AI analysis of correlations
    const corrPrompt = `Please analyze this correlation matrix and provide insights from a process engineering perspective: ${JSON.stringify(correlationMatrix)}`;
    
    const corrResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: corrPrompt }
        ],
      }),
    });

    if (!corrResponse.ok) {
      throw new Error('Failed to get AI analysis of correlations');
    }

    const corrAiData = await corrResponse.json();
    const corrAnalysis = corrAiData.choices[0].message.content;

    const analysis = {
      correlationMatrix,
      mappings: categoricalMappings,
      descriptiveStats,
      statsAnalysis,
      corrAnalysis
    };

    // Save results to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    console.log('Saving analysis results for project:', projectId);

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/analysis_results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        project_id: projectId,
        results: analysis,
        descriptive_stats: descriptiveStats
      }),
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      throw new Error(`Failed to save analysis results: ${errorText}`);
    }

    console.log('Analysis results saved successfully');

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-dataset function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
