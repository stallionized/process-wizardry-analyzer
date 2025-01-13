import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, clientName, topics } = await req.json();
    
    if (!projectId || !clientName || !topics) {
      throw new Error('Missing required parameters');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate multiple search queries to increase coverage
    const searchQueries = [
      `${clientName} customer complaints reviews`,
      `${clientName} ${topics} issues problems`,
      `${clientName} negative feedback concerns`,
      `${clientName} product quality complaints`,
      `${clientName} service issues reviews`,
    ];
    
    // Simulate gathering complaints from multiple sources
    const complaints = [];
    for (const query of searchQueries) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are analyzing customer feedback for ${clientName} related to ${topics}. Generate realistic complaints and categorize them into high-level business categories. Focus on major themes that would be actionable for business improvement.`
            },
            {
              role: 'user',
              content: `Based on "${query}", generate 5 realistic customer complaints. For each complaint, provide:
              1. The complaint text
              2. A high-level business category (e.g., "Product Quality", "Customer Service", "Delivery Experience")
              3. A simulated source URL
              Format as JSON array with objects containing: text, category, source_url`
            }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const generatedComplaints = JSON.parse(data.choices[0].message.content);
      complaints.push(...generatedComplaints);
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert complaints
    const { error: insertError } = await supabaseClient
      .from('complaints')
      .insert(complaints.map(c => ({
        project_id: projectId,
        complaint_text: c.text,
        theme: c.category,
        trend: c.category, // Using same value for theme/trend as requested
        source_url: c.source_url,
      })));

    if (insertError) throw insertError;

    // Calculate summaries
    const summaries = complaints.reduce((acc, c) => {
      const category = c.category;
      if (!acc[category]) {
        acc[category] = {
          theme: category,
          volume: 0,
          sources: new Set(),
          project_id: projectId,
        };
      }
      acc[category].volume++;
      acc[category].sources.add(c.source_url);
      return acc;
    }, {});

    // Update summaries
    const { error: summaryError } = await supabaseClient
      .from('complaint_summaries')
      .upsert(
        Object.values(summaries).map(s => ({
          ...s,
          sources: Array.from(s.sources),
        }))
      );

    if (summaryError) throw summaryError;

    return new Response(
      JSON.stringify({ success: true, complaintsCount: complaints.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-complaints function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});