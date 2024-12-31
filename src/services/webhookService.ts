import { FileData } from '@/types';

export const sendFilesToWebhook = async (projectId: string, files: FileData[]) => {
  const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || '';
  if (!WEBHOOK_URL) {
    console.log('No webhook URL configured, skipping webhook call');
    return true;
  }

  try {
    const webhookData = {
      data: {
        projectId,
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          url: file.url
        }))
      }
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      console.error('Webhook call failed:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error calling webhook:', error);
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