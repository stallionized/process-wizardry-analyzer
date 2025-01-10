import { FileData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const sendFilesToWebhook = async (projectId: string, files: FileData[]) => {
  console.log('Attempting to analyze files:', files);
  
  try {
    const response = await supabase.functions.invoke('analyze-dataset', {
      body: {
        projectId,
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          url: file.url
        }))
      }
    });

    if (!response.error) {
      console.log('Analysis started successfully:', response.data);
      return true;
    } else {
      console.error('Error starting analysis:', response.error);
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