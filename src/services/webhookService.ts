import { FileData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const sendFilesToWebhook = async (projectId: string, files: FileData[]) => {
  console.log('Attempting to analyze files:', files);
  
  try {
    const payload = {
      projectId,
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        url: file.url,
        type: file.type
      }))
    };

    console.log('Sending payload to analyze-dataset:', JSON.stringify(payload));

    const { data, error } = await supabase.functions.invoke('analyze-dataset', {
      body: payload
    });

    if (error) {
      console.error('Error from Edge Function:', error);
      return false;
    }

    console.log('Analysis started successfully:', data);
    return true;
  } catch (error) {
    console.error('Error calling analysis function:', error);
    return false;
  }
};

export const analyzeDataset = async (fileUrl: string, projectId: string) => {
  try {
    const payload = { fileUrl, projectId };
    console.log('Sending single file analysis payload:', JSON.stringify(payload));

    const { data, error } = await supabase.functions.invoke('analyze-dataset', {
      body: payload
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error analyzing dataset:', error);
    throw error;
  }
};