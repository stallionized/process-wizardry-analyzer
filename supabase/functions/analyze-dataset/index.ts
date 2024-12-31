import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Extract columns and prepare data for correlation
    const columns = Object.keys(jsonData[0] || {});
    const numericalData: Record<string, number[]> = {};
    const categoricalMappings: Record<string, Record<string, number>> = {};

    // Process each column
    columns.forEach(column => {
      const values = jsonData.map(row => row[column]);
      
      // Check if column contains numerical data
      const isNumerical = values.every(value => 
        typeof value === 'number' || 
        (typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^0-9.-]/g, ''))))
      );

      if (isNumerical) {
        // Convert to numbers
        numericalData[column] = values.map(value => 
          typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, ''))
        );
      } else {
        // Create mapping for categorical data
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
        
        // Calculate mean
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
        
        // Calculate covariance and variances
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
        
        // Calculate correlation coefficient
        const correlation = covariance / Math.sqrt(variance1 * variance2);
        correlationMatrix[col1][col2] = Number(correlation.toFixed(4));
      });
    });

    console.log('Correlation matrix calculated successfully');

    const analysis = {
      correlationMatrix,
      mappings: categoricalMappings
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