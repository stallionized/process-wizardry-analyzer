import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processExcelData } from './dataProcessing.ts';
import { getClaudeAnalysis } from './claudeService.ts';
import { AnalysisInput } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Log the raw request for debugging
    console.log('Received request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    // Get the request body as text first for logging
    const bodyText = await req.text();
    console.log('Raw request body:', bodyText);

    // Parse the JSON body
    let input: AnalysisInput;
    try {
      input = JSON.parse(bodyText);
      console.log('Parsed input:', input);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: error.message
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        }
      );
    }

    // Validate required fields
    if (!input.files?.length) {
      throw new Error('No files provided for analysis');
    }

    if (!input.projectId) {
      throw new Error('Project ID is required');
    }

    console.log('Processing files:', input.files);
    console.log('Project ID:', input.projectId);

    // Process Excel data
    const {
      numericalData,
      categoricalMappings,
      descriptiveStats,
      correlationMatrix,
      statsAnalysis,
      controlCharts
    } = await processExcelData(input);

    // Get Claude analysis
    console.log('Getting Claude analysis');
    const advancedAnalysis = await getClaudeAnalysis(descriptiveStats, numericalData);
    console.log('Claude analysis completed');

    const analysis = {
      correlationMatrix,
      mappings: categoricalMappings,
      descriptiveStats,
      statsAnalysis,
      controlCharts: advancedAnalysis.controlCharts
    };

    // Save to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    console.log('Saving analysis results for project:', input.projectId);

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
        control_charts: advancedAnalysis.controlCharts
      }),
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error('Failed to save analysis results:', errorText);
      throw new Error(`Failed to save analysis results: ${errorText}`);
    }

    console.log('Analysis results saved successfully');

    return new Response(
      JSON.stringify({ success: true, analysis }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-dataset function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});