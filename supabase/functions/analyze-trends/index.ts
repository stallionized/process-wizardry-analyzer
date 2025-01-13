import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { projectId, files } = await req.json();

    console.log('Analyzing trends for project:', projectId);

    // Fetch the latest analysis results
    const { data: results, error: fetchError } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error fetching analysis results:', fetchError);
      throw fetchError;
    }

    if (!results?.descriptive_stats) {
      console.log('No descriptive stats found for analysis');
      return new Response(
        JSON.stringify({ 
          summary: 'Analysis results are not yet available. Please wait for the initial analysis to complete.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('Fetching trends analysis from Claude');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are analyzing a dataset to identify trends and patterns. Here's the statistical information:

          ${JSON.stringify(results.descriptive_stats, null, 2)}

          Provide a clear and direct analysis that:
          1. Identifies and explains the main trends
          2. Describes any notable patterns or relationships
          3. Highlights unusual or significant observations
          4. Explains practical business implications

          Important guidelines:
          - Start directly with the analysis, no introductory phrases
          - Use clear, non-technical language
          - If no significant trends exist, state this clearly
          - Focus on actionable insights
          - Do not use any headings or section titles`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const claudeResponse = await response.json();
    console.log('Received response from Claude');

    return new Response(
      JSON.stringify({ summary: claudeResponse.content[0].text }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in analyze-trends function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});