import { FileData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const sendFilesToWebhook = async (projectId: string, files: FileData[]) => {
  console.log('Attempting to analyze files:', files);
  
  try {
    // Add retry logic
    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
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

        if (response.error) {
          console.error('Error from Edge Function:', response.error);
          throw response.error;
        }

        console.log('Analysis started successfully:', response.data);
        return true;
      } catch (error) {
        lastError = error;
        attempt++;
        if (attempt < maxRetries) {
          console.log(`Retry attempt ${attempt} of ${maxRetries}`);
          // Wait for 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error('All retry attempts failed. Last error:', lastError);
    return false;
  } catch (error) {
    console.error('Error calling analysis function:', error);
    return false;
  }
};

export const analyzeDataset = async (fileUrl: string, projectId: string) => {
  try {
    const response = await supabase.functions.invoke('analyze-dataset', {
      body: { fileUrl, projectId }
    });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error) {
    console.error('Error analyzing dataset:', error);
    throw error;
  }
};