import { getClaudeAnalysis } from './claudeService.ts';

export async function generateControlCharts(numericalData: Record<string, number[]>) {
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
    return analysis;
  } catch (error) {
    console.error('Error generating control charts:', error);
    throw error;
  }
}