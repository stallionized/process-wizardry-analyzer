import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processExcelData } from './dataProcessing.ts';
import { getClaudeAnalysis } from './claudeService.ts';
import { generateControlCharts } from './controlChartService.ts';
import { AnalysisInput } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log('Starting analyze-dataset function');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const input = await req.json() as AnalysisInput;
    console.log('Received input:', {
      projectId: input.projectId,
      files: input.files.map(f => ({ name: f.name, url: f.url }))
    });

    if (!input.files?.length) {
      throw new Error('No files provided for analysis');
    }

    if (!input.projectId) {
      throw new Error('Project ID is required');
    }

    // Process Excel data
    console.log('Processing Excel data...');
    const {
      numericalData,
      descriptiveStats,
      correlationMatrix,
      statsAnalysis
    } = await processExcelData(input);

    console.log('Excel data processed. Number of columns:', Object.keys(numericalData).length);
    console.log('Numerical columns:', Object.keys(numericalData));

    // Get Claude analysis
    console.log('Getting Claude analysis...');
    const advancedAnalysis = await getClaudeAnalysis(
      `Analyze this numerical dataset and provide insights: ${JSON.stringify(numericalData)}`
    );
    console.log('Claude analysis completed');

    // Generate control charts
    console.log('Generating control charts...');
    const controlCharts = await generateControlCharts(numericalData);
    console.log('Control charts generated');

    const analysis = {
      correlationMatrix,
      descriptiveStats,
      statsAnalysis,
      advancedAnalysis: {
        ...advancedAnalysis,
        timestamp: new Date().toISOString()
      }
    };

    // Save to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    console.log('Saving analysis results...');
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/analysis_results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        project_id: input.projectId,
        results: analysis,
        descriptive_stats: descriptiveStats,
        control_charts: controlCharts,
        status: 'completed'
      }),
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error('Failed to save analysis results:', errorText);
      throw new Error(`Failed to save analysis results: ${errorText}`);
    }

    console.log('Analysis results saved successfully');

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-dataset function:', error);
    
    try {
      const input = await req.json() as AnalysisInput;
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/analysis_results`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            project_id: input.projectId,
            status: 'failed',
            error_message: error.message
          }),
        });
      }
    } catch (saveError) {
      console.error('Error saving failure status:', saveError);
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});