import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { processExcelData } from './dataProcessing.ts';
import { getClaudeAnalysis } from './claudeService.ts';

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
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse and validate request body
    let payload;
    try {
      payload = await req.json();
      console.log('Received payload:', JSON.stringify(payload));
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: error.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Validate required fields
    if (!payload.projectId || !payload.files || !Array.isArray(payload.files)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request format',
          details: 'Request must include projectId and files array'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process dataset files
    console.log('Starting dataset analysis');
    
    try {
      // Process Excel data
      const {
        numericalData,
        categoricalMappings,
        descriptiveStats,
        correlationMatrix,
        statsAnalysis
      } = await processExcelData({ files: payload.files });

      console.log('Excel data processed successfully');

      // Get control charts analysis using Claude
      console.log('Starting control charts analysis');
      const controlChartsAnalysis = await getClaudeAnalysis(descriptiveStats, numericalData);
      console.log('Control charts analysis completed');

      // Store analysis results
      const { error: insertError } = await supabase
        .from('analysis_results')
        .insert({
          project_id: payload.projectId,
          results: {
            correlationMatrix,
            mappings: categoricalMappings,
            descriptiveStats,
            statsAnalysis,
            controlCharts: controlChartsAnalysis.controlCharts
          }
        });

      if (insertError) {
        console.error('Error inserting analysis results:', insertError);
        throw insertError;
      }

      console.log('Analysis results stored successfully');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Analysis completed successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } catch (analysisError) {
      console.error('Error during analysis:', analysisError);
      return new Response(
        JSON.stringify({ 
          error: 'Analysis failed',
          details: analysisError.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});