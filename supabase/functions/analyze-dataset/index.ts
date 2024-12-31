import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files } = await req.json();
    console.log('Processing files:', files);

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for analysis');
    }

    // Download and process the first file
    const fileUrl = files[0].url;
    console.log('Downloading file from:', fileUrl);

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('File downloaded successfully');

    // Parse Excel file
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    console.log('Parsed Excel data:', jsonData);

    // Extract numerical columns
    const numericalData: Record<string, number[]> = {};
    const headers = Object.keys(jsonData[0] || {});

    headers.forEach(header => {
      const values = jsonData.map(row => row[header]);
      if (values.every(value => typeof value === 'number' || !isNaN(Number(value)))) {
        numericalData[header] = values.map(value => Number(value));
      }
    });

    console.log('Extracted numerical columns:', Object.keys(numericalData));

    // Calculate correlation matrix
    const correlationMatrix: Record<string, Record<string, number>> = {};
    const columns = Object.keys(numericalData);

    columns.forEach(col1 => {
      correlationMatrix[col1] = {};
      columns.forEach(col2 => {
        const values1 = numericalData[col1];
        const values2 = numericalData[col2];
        
        // Calculate Pearson correlation coefficient
        const mean1 = values1.reduce((a, b) => a + b) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b) / values2.length;
        
        const variance1 = values1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0);
        const variance2 = values2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0);
        
        const covariance = values1.reduce((a, b, i) => a + (b - mean1) * (values2[i] - mean2), 0);
        
        const correlation = covariance / Math.sqrt(variance1 * variance2);
        correlationMatrix[col1][col2] = Number(correlation.toFixed(4));
      });
    });

    console.log('Calculated correlation matrix:', correlationMatrix);

    // Prepare the analysis results
    const analysis = {
      correlationMatrix,
      mappings: {} // Keep mappings empty for now
    };

    // Save results to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/analysis_results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        project_id: files[0].project_id,
        results: analysis,
      }),
    });

    if (!supabaseResponse.ok) {
      const supabaseError = await supabaseResponse.text();
      console.error('Failed to save analysis results:', supabaseError);
      throw new Error('Failed to save analysis results');
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-dataset function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});