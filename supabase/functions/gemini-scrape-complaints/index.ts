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
    const { clientName, projectId, page = 1 } = await req.json();
    
    if (!clientName) {
      throw new Error('Client name is required');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log('Processing complaints for:', clientName);

    // Generate search queries to increase coverage
    const searchQueries = [
      `${clientName} customer complaints reviews`,
      `${clientName} product quality issues problems`,
      `${clientName} negative feedback concerns`,
      `${clientName} service issues reviews`,
    ];

    const complaints = [];
    
    for (const query of searchQueries) {
      console.log('Processing search query:', query);
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Based on the search query "${query}" for ${clientName}, generate 3 realistic customer complaints. For each complaint, provide:
              1. The complaint text
              2. A high-level business category (e.g., "Product Quality", "Customer Service", "Delivery")
              3. A simulated source URL (use a realistic domain)
              Format as JSON array with objects containing: complaint_text, category, source_url`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      try {
        // Extract the JSON array from the response text
        const jsonStr = generatedText.substring(
          generatedText.indexOf('['),
          generatedText.lastIndexOf(']') + 1
        );
        const generatedComplaints = JSON.parse(jsonStr);
        complaints.push(...generatedComplaints);
      } catch (error) {
        console.error('Error parsing Gemini response:', error);
        continue;
      }
    }

    console.log(`Generated ${complaints.length} complaints`);

    // Store complaints in the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase
      .from('complaints')
      .insert(
        complaints.map(complaint => ({
          complaint_text: complaint.complaint_text,
          source_url: complaint.source_url,
          theme: complaint.category,
          trend: complaint.category,
          project_id: projectId,
        }))
      );

    if (insertError) {
      console.error('Error storing complaints:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        complaints,
        hasMore: false
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in gemini-scrape-complaints function:', error);
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