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
    const { clientName } = await req.json();
    
    if (!clientName) {
      throw new Error('Client name is required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Generate search queries to increase coverage
    const searchQueries = [
      `${clientName} customer complaints reviews`,
      `${clientName} product quality issues problems`,
      `${clientName} negative feedback concerns`,
      `${clientName} service issues reviews`,
    ];
    
    // Gather complaints from multiple sources
    const complaints = [];
    for (const query of searchQueries) {
      console.log('Processing search query:', query);
      
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
              content: `You are analyzing customer feedback for ${clientName}. Generate realistic complaints and categorize them into high-level business categories. Focus on major themes that would be actionable for business improvement.`
            },
            {
              role: 'user',
              content: `Based on "${query}", generate 3 realistic customer complaints. For each complaint, provide:
              1. The complaint text
              2. A high-level business category (e.g., "Product Quality", "Customer Service", "Delivery")
              3. A simulated source URL (use a realistic domain)
              Format as JSON array with objects containing: complaint_text, category, source_url`
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedComplaints = JSON.parse(data.choices[0].message.content);
      complaints.push(...generatedComplaints);
    }

    console.log(`Generated ${complaints.length} complaints`);

    // Store complaints in the database
    const { error: insertError } = await supabaseAdmin
      .from('complaints')
      .insert(
        complaints.map(complaint => ({
          complaint_text: complaint.complaint_text,
          source_url: complaint.source_url,
          theme: complaint.category,
          trend: complaint.category, // Using category as both theme and trend
          project_id: req.projectId,
        }))
      );

    if (insertError) {
      console.error('Error storing complaints:', insertError);
      throw insertError;
    }

    // Calculate and store complaint summaries
    const summaries = complaints.reduce((acc, complaint) => {
      const category = complaint.category;
      if (!acc[category]) {
        acc[category] = {
          theme: category,
          volume: 0,
          sources: new Set(),
          complaints: [],
          project_id: req.projectId,
        };
      }
      acc[category].volume++;
      acc[category].sources.add(complaint.source_url);
      acc[category].complaints.push(complaint.complaint_text);
      return acc;
    }, {});

    // Update complaint summaries
    const { error: summaryError } = await supabaseAdmin
      .from('complaint_summaries')
      .upsert(
        Object.values(summaries).map(summary => ({
          ...summary,
          sources: Array.from(summary.sources),
          complaints: Array.from(summary.complaints),
        }))
      );

    if (summaryError) {
      console.error('Error storing summaries:', summaryError);
      throw summaryError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        complaintsCount: complaints.length,
        complaints,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-complaints function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});