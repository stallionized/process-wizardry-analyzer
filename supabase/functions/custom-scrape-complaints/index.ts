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
    const { clientName, projectId } = await req.json();
    
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

    // Generate variations of the company name for better search coverage
    const nameVariations = [
      clientName,
      clientName.toLowerCase(),
      clientName.replace(/\s+/g, ''),  // Remove spaces
      clientName.replace(/[^a-zA-Z0-9]/g, ''), // Remove special characters
    ];

    const complaints = [];
    const sources = [
      {
        name: 'BBB',
        baseUrl: 'https://www.bbb.org/search?find_text=',
        category: 'BBB Review'
      },
      {
        name: 'Trustpilot',
        baseUrl: 'https://www.trustpilot.com/review/',
        category: 'Trustpilot Review'
      },
      {
        name: 'ConsumerAffairs',
        baseUrl: 'https://www.consumeraffairs.com/search?query=',
        category: 'Consumer Affairs Review'
      }
    ];

    // Mock data for demonstration (replace with actual scraping logic)
    const mockComplaints = [
      {
        text: "Product quality has declined significantly over the past year. The taste is inconsistent.",
        date: new Date().toISOString(),
        source: "Consumer Review",
        category: "Product Quality"
      },
      {
        text: "Customer service was unresponsive when I tried to report a quality issue with my purchase.",
        date: new Date().toISOString(),
        source: "Customer Feedback",
        category: "Customer Service"
      },
      {
        text: "Packaging was damaged upon delivery and the company took weeks to address the issue.",
        date: new Date().toISOString(),
        source: "Product Review",
        category: "Shipping & Handling"
      }
    ];

    // Store complaints in the database
    if (mockComplaints.length > 0) {
      const { error: insertError } = await supabase
        .from('complaints')
        .upsert(
          mockComplaints.map(complaint => ({
            complaint_text: complaint.text,
            source_url: `https://example.com/review/${Math.random().toString(36).substring(7)}`,
            theme: complaint.category,
            trend: 'Recent',
            project_id: projectId,
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
    console.error('Error in custom-scrape-complaints function:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});