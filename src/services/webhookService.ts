interface FileData {
  id: string;
  name: string;
  url: string;
}

export const sendFilesToWebhook = async (projectId: string, files: FileData[]) => {
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

    const response = await fetch('https://hook.us1.make.com/54vxfeqcuks6v5o1yxl2bieb8i97lfnq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Webhook warning:', errorText);
      // Don't throw error, just return false to indicate webhook failed but we can continue
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Webhook warning:', error);
    // Don't throw error, just return false to indicate webhook failed but we can continue
    return false;
  }
};