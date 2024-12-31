interface FileData {
  id: string;
  name: string;
  url: string;
}

export const sendFilesToWebhook = async (projectId: string, files: FileData[]) => {
  // Skip webhook call if URL is not configured
  const WEBHOOK_URL = 'https://hook.us1.make.com/54vxfeqcuks6v5o1yxl2bieb8i97lfnq';
  if (!WEBHOOK_URL) {
    console.log('No webhook URL configured, skipping webhook call');
    return true;
  }

  try {
    const webhookData = {
      projectId,
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        url: file.url
      }))
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