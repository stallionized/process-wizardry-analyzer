import { FileData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const sendFilesToWebhook = async (projectId: string, files: FileData[]): Promise<boolean> => {
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

    console.log('Sending payload to analyze-dataset:', payload);

    const { data, error } = await supabase.functions.invoke('analyze-dataset', {
      body: payload,
      headers: {
        'Content-Type': 'application/json'
      }
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