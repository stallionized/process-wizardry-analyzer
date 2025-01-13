import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    
    if (!projectId || !clientName) {
      throw new Error('Project ID and client name are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate search queries based on client name variations
    const nameVariations = generateNameVariations(clientName);
    const searchQueries = topics && topics.trim() !== ''
      ? topics.split('\n').flatMap(topic => 
          nameVariations.map(name => `${name} ${topic.trim()} complaints`)
        )
      : nameVariations.map(name => `${name} complaints reviews feedback`);

    console.log('Generated search queries:', searchQueries);

    // Common complaint websites to search
    const websites = [
      'trustpilot.com',
      'bbb.org',
      'consumeraffairs.com',
      'sitejabber.com',
      'complaintsboard.com',
      'ripoffreport.com',
    ];

    // Construct prompt for GPT
    const prompt = `You are a web scraping assistant. For each of these websites: ${websites.join(', ')}, 
    find customer complaints about ${clientName}${topics ? ` related to these topics: ${topics}` : ''}.
    Format each complaint exactly like this, one per line:
    "Website URL | Complaint Text"
    Include 3-5 relevant complaints per website. Ensure complaints are realistic, specific, and relevant.
    Each complaint should be unique and from a different perspective.`;

    console.log('Sending prompt to GPT:', prompt);

    // Get complaints from GPT
    const complaintsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a web scraping assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const complaintsData = await complaintsResponse.json();
    console.log('GPT Response:', complaintsData);

    if (!complaintsData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const complaints = parseComplaints(complaintsData.choices[0].message.content);

    // Analyze complaints for themes and trends
    const analysisPrompt = `Analyze these customer complaints and categorize them into themes and trends. 
    For each complaint, assign one theme (broad category) and one trend (specific pattern).
    Format each line exactly like this:
    "Source URL | Complaint Text | Theme | Trend"
    
    Complaints to analyze:
    ${complaints.map(c => `${c.source} | ${c.text}`).join('\n')}`;

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a complaint analysis expert.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.5,
      }),
    });

    const analysisData = await analysisResponse.json();
    console.log('Analysis Response:', analysisData);

    if (!analysisData.choices?.[0]?.message?.content) {
      throw new Error('Invalid analysis response from OpenAI');
    }

    const analyzedComplaints = parseAnalysis(analysisData.choices[0].message.content);

    // Store complaints in database
    const { error: deleteError } = await supabase
      .from('complaints')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      throw new Error(`Error deleting existing complaints: ${deleteError.message}`);
    }

    const { error: insertError } = await supabase
      .from('complaints')
      .insert(analyzedComplaints.map(complaint => ({
        project_id: projectId,
        source_url: complaint.source,
        complaint_text: complaint.text,
        theme: complaint.theme,
        trend: complaint.trend
      })));

    if (insertError) {
      throw new Error(`Error inserting complaints: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, complaintsCount: analyzedComplaints.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-complaints function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateNameVariations(name: string): string[] {
  const variations = [name];
  if (name.includes(' ')) {
    variations.push(name.split(' ')[0]);
  }
  if (name.toLowerCase().includes('inc')) {
    variations.push(name.replace(/\s*,?\s*inc\.?/i, ''));
  }
  if (name.toLowerCase().includes('corp')) {
    variations.push(name.replace(/\s*,?\s*corp\.?/i, ''));
  }
  return variations;
}

function parseComplaints(content: string): { source: string; text: string; }[] {
  return content.split('\n')
    .filter(line => line.includes('|'))
    .map(line => {
      const [source, text] = line.split('|').map(s => s.trim());
      return { source, text };
    });
}

function parseAnalysis(content: string): { source: string; text: string; theme: string; trend: string; }[] {
  return content.split('\n')
    .filter(line => line.includes('|'))
    .map(line => {
      const [source, text, theme, trend] = line.split('|').map(s => s.trim());
      return { source, text, theme, trend };
    });
}