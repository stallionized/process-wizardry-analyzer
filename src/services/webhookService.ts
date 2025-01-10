import { FileData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const sendFilesToWebhook = async (projectId: string, files: FileData[]) => {
  console.log('Attempting to analyze files:', files);
  
  try {
    // Create initial analysis record
    const { error: insertError } = await supabase
      .from('analysis_results')
      .insert({
        project_id: projectId,
        status: 'pending',
        results: {},
        started_at: new Date().toISOString(),
        file_size_bytes: files.reduce((acc, file) => acc + (file.size || 0), 0),
      });

    if (insertError) {
      console.error('Error creating analysis record:', insertError);
      return false;
    }

    const response = await supabase.functions.invoke('analyze-dataset', {
      body: {
        projectId,
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          url: file.url,
          size: file.size
        }))
      }
    });

    if (!response.error) {
      console.log('Analysis started successfully:', response.data);
      return true;
    } else {
      console.error('Error starting analysis:', response.error);
      
      // Update analysis record to failed state
      await supabase
        .from('analysis_results')
        .update({ 
          status: 'failed',
        })
        .eq('project_id', projectId)
        .is('completed_at', null);
        
      return false;
    }
  } catch (error) {
    console.error('Error calling analysis function:', error);
    return false;
  }
};

export const analyzeDataset = async (fileUrl: string, projectId: string) => {
  try {
    const response = await fetch('/functions/analyze-dataset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl, projectId }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze dataset');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing dataset:', error);
    throw error;
  }
};