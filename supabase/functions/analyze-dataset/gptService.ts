const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function getGPTAnalysis(
  numericalData: Record<string, number[]>,
  retryCount = 0
): Promise<any> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 61000;

  try {
    const dataSummary = {
      sampleSize: Object.values(numericalData)[0]?.length || 0,
      data: numericalData
    };

    const prompt = `You are a statistical analysis expert. Analyze this dataset and provide:
1. Descriptive statistics for each numerical variable
2. A correlation matrix showing relationships between variables
3. A natural language summary of the key statistical findings

Important instructions:
1. Calculate standard descriptive statistics (mean, median, std dev, etc.)
2. Generate a correlation matrix with values between -1 and 1
3. Provide an executive summary of the statistical relationships
4. Focus on practical insights and patterns in the data

Return ONLY valid JSON matching this structure:
{
  "descriptiveStats": {
    "variableName": {
      "count": number,
      "mean": number,
      "median": number,
      "stdDev": number,
      "variance": number,
      "min": number,
      "max": number,
      "range": number,
      "q1": number,
      "q3": number
    }
  },
  "correlationMatrix": {
    "var1": {
      "var2": number
    }
  },
  "statsAnalysis": "string"
}

Dataset: ${JSON.stringify(dataSummary)}`;

    console.log(`Analyzing statistics for ${dataSummary.sampleSize} samples using GPT-4o`);

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a statistical analysis expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      }),
    });

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text();
      console.error('GPT API error:', errorText);
      
      if (errorText.includes('rate_limit') && retryCount < MAX_RETRIES) {
        console.log(`Rate limit hit, retry ${retryCount + 1}/${MAX_RETRIES} after ${RETRY_DELAY}ms`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return getGPTAnalysis(numericalData, retryCount + 1);
      }
      
      throw new Error(`Failed to get GPT analysis: ${errorText}`);
    }

    const gptData = await gptResponse.json();
    const responseText = gptData.choices[0].message.content.trim();
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in GPT response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      if (!parsedResponse.descriptiveStats || !parsedResponse.correlationMatrix) {
        throw new Error('Invalid statistics structure in response');
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Failed to parse GPT response:', error);
      throw error;
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Error occurred, retry ${retryCount + 1}/${MAX_RETRIES} after delay`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return getGPTAnalysis(numericalData, retryCount + 1);
    }
    throw error;
  }
}