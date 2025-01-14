import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

    console.log(`Starting scraping for ${clientName}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // For now, return mock data since we removed the external dependencies
    const mockComplaints = [
      {
        text: "Sample complaint 1",
        date: new Date().toISOString(),
        source: "Mock Data"
      },
      {
        text: "Sample complaint 2",
        date: new Date().toISOString(),
        source: "Mock Data"
      }
    ];

    // Store complaints in the database
    if (mockComplaints.length > 0) {
      const { error: insertError } = await supabase
        .from('complaints')
        .upsert(
          mockComplaints.map(complaint => ({
            complaint_text: complaint.text,
            source_url: complaint.source,
            theme: 'Customer Review',
            project_id: req.projectId,
            created_at: complaint.date
          }))
        );

      if (insertError) {
        console.error('Error storing complaints:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        complaintsCount: mockComplaints.length,
        complaints: mockComplaints
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-complaints function:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});