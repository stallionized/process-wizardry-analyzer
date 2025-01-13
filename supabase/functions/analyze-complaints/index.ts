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
    const { projectId, clientName, topics } = await req.json();
    
    if (!projectId || !clientName || !topics) {
      throw new Error('Missing required parameters');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate search query based on client name and topics
    const searchQuery = `${clientName} ${topics} complaints reviews issues problems`;
    
    // Call OpenAI to analyze the complaints
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes customer complaints and feedback. Identify key themes and trends.'
          },
          {
            role: 'user',
            content: `Analyze the following search query and generate sample complaints that might be relevant: ${searchQuery}`
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Create complaints records in the database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse the analysis and create complaint records
    const complaints = analysis.split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((complaint: string) => ({
        project_id: projectId,
        source_url: 'ai-generated', // This is a placeholder
        complaint_text: complaint,
        theme: 'General', // This would be enhanced with better categorization
        trend: 'Initial Analysis',
      }));

    const { error } = await supabaseClient
      .from('complaints')
      .insert(complaints);

    if (error) throw error;

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