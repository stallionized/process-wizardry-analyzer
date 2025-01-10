import { getClaudeAnalysis } from './claudeService.ts';

export async function generateControlCharts(numericalData: Record<string, number[]>) {
  console.log('Generating control charts for data:', Object.keys(numericalData));
  
  // Validate input data
  if (!numericalData || typeof numericalData !== 'object') {
    console.error('Invalid dataset: numericalData is null or not an object');
    throw new Error('Invalid dataset provided for control chart generation');
  }

  const numericColumns = Object.keys(numericalData);
  if (numericColumns.length === 0) {
    console.error('Invalid dataset: no numeric columns found');
    throw new Error('No numeric columns found for control chart generation');
  }

  // Validate that each column has data
  for (const column of numericColumns) {
    if (!Array.isArray(numericalData[column]) || numericalData[column].length === 0) {
      console.error(`Invalid data for column ${column}: empty or not an array`);
      throw new Error(`Invalid data for column ${column}`);
    }
  }

  const prompt = `You are a process control expert. Analyze this numerical dataset and generate control charts. For each variable, determine if a control chart would be appropriate and if so, generate the control chart data including control limits (UCL, LCL) and center line.

Return ONLY valid JSON matching this structure, with no additional text:
{
  "controlCharts": [
    {
      "variable": "string",
      "type": "string",
      "data": {
        "values": number[],
        "ucl": number,
        "lcl": number,
        "centerLine": number,
        "movingRanges": number[]
      },
      "interpretation": "string",
      "outOfControlPoints": number[]
    }
  ],
  "summary": "string"
}

Dataset: ${JSON.stringify(numericalData)}`;

  try {
    console.log('Sending data to Claude for control chart analysis');
    const analysis = await getClaudeAnalysis(prompt);
    
    if (!analysis?.controlCharts || !Array.isArray(analysis.controlCharts)) {
      console.error('Invalid control chart analysis structure:', analysis);
      throw new Error('Invalid control chart analysis structure');
    }

    // Validate each control chart
    analysis.controlCharts.forEach((chart, index) => {
      if (!chart.variable || !chart.type || !chart.data || 
          typeof chart.data.ucl !== 'number' || 
          typeof chart.data.lcl !== 'number' || 
          typeof chart.data.centerLine !== 'number' ||
          !Array.isArray(chart.data.values)) {
        console.error(`Invalid control chart data for chart ${index + 1}:`, chart);
        throw new Error(`Invalid control chart data for chart ${index + 1}`);
      }
    });

    console.log(`Successfully generated ${analysis.controlCharts.length} control charts`);
    return analysis;
  } catch (error) {
    console.error('Error generating control charts:', error);
    throw error;
  }
}