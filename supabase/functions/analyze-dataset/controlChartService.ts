import { getClaudeAnalysis } from './claudeService.ts';

export async function generateControlCharts(numericalData: Record<string, number[]>) {
  // Validate input data
  if (!numericalData || typeof numericalData !== 'object' || Object.keys(numericalData).length === 0) {
    throw new Error('Invalid dataset provided for control chart generation');
  }

  const prompt = `You are a process control expert. Analyze this numerical dataset and generate control charts. For each variable, determine if a control chart would be appropriate and if so, generate the control chart data including control limits (UCL, LCL) and center line.

Return ONLY valid JSON matching this structure, with no additional text:
{
  "controlCharts": [
    {
      "variable": "string",
      "type": "string", // e.g. "Individual-Moving Range", "Xbar-R", "Xbar-S", etc.
      "data": {
        "values": number[],
        "ucl": number,
        "lcl": number,
        "centerLine": number,
        "movingRanges": number[] // only for I-MR charts
      },
      "interpretation": "string",
      "outOfControlPoints": number[]
    }
  ],
  "summary": "string"
}

Dataset: ${JSON.stringify(numericalData)}`;

  try {
    const analysis = await getClaudeAnalysis(prompt);
    
    // Validate the response structure
    if (!analysis?.controlCharts || !Array.isArray(analysis.controlCharts)) {
      throw new Error('Invalid control chart analysis structure');
    }

    // Validate each control chart
    analysis.controlCharts.forEach((chart, index) => {
      if (!chart.variable || !chart.type || !chart.data || 
          typeof chart.data.ucl !== 'number' || 
          typeof chart.data.lcl !== 'number' || 
          typeof chart.data.centerLine !== 'number' ||
          !Array.isArray(chart.data.values)) {
        throw new Error(`Invalid control chart data for chart ${index + 1}`);
      }
    });

    return analysis;
  } catch (error) {
    console.error('Error generating control charts:', error);
    throw error;
  }
}