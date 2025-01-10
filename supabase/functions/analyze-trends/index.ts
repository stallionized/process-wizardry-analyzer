import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { projectId, files } = await req.json();
    console.log('Analyzing trends for project:', projectId);

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }

    // Get the data from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Fetch the latest analysis results
    const response = await fetch(
      `${supabaseUrl}/rest/v1/analysis_results?project_id=eq.${projectId}&order=created_at.desc&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch analysis results: ${response.statusText}`);
    }

    const [results] = await response.json();
    if (!results?.descriptive_stats) {
      console.log('No analysis results found for project:', projectId);
      return new Response(
        JSON.stringify({ summary: 'Analysis results are not yet available. Please wait for the dataset analysis to complete.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending request to Claude API');
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
          content: `Analyze this dataset and identify key trends and themes. Here's the statistical information about the dataset:

          ${JSON.stringify(results.descriptive_stats, null, 2)}

          Please provide a clear analysis that:
          1. Identifies and explains key trends
          2. Highlights notable patterns or relationships in the data
          3. Points out any unusual or significant observations
          4. Explains the business implications of these findings

          Keep the response focused and avoid technical jargon. If no significant trends are found, clearly state that the data shows no notable patterns.

          Important: Do not use the phrase "Executive Summary" in your response.`
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Failed to get Claude analysis: ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    console.log('Received response from Claude');
    
    if (!claudeData?.content?.[0]?.text) {
      console.error('Invalid Claude response structure:', claudeData);
      throw new Error('Invalid response from Claude API');
    }

    // Store the trends analysis in the database
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/analysis_results`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          project_id: projectId,
          results: { trends_analysis: claudeData.content[0].text },
          status: 'completed'
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to store trends analysis');
    }

    return new Response(
      JSON.stringify({ summary: claudeData.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-trends function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});