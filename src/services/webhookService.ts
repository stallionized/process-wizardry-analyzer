interface FileData {
  id: string;
  name: string;
  url: string;
}

export const sendFilesToWebhook = async (projectId: string, files: FileData[]) => {
  // Skip webhook call if URL is not configured
  const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || '';
  if (!WEBHOOK_URL) {
    console.log('No webhook URL configured, skipping webhook call');
    return true;
  }

  try {
    // Format data according to Make.com webhook requirements
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

    // Store response text immediately to avoid stream already read error
    const responseText = await response.text();

    if (!response.ok) {
      console.warn('Webhook warning:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Webhook warning:', error);
    return false;
  }
};