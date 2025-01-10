export async function generateControlCharts(numericalData: Record<string, number[]>) {
  console.log('Generating control charts for columns:', Object.keys(numericalData));
  
  if (!numericalData || typeof numericalData !== 'object') {
    console.error('Invalid dataset: numericalData is null or not an object');
    throw new Error('Invalid dataset provided for control chart generation');
  }

  const numericColumns = Object.keys(numericalData);
  if (numericColumns.length === 0) {
    console.error('Invalid dataset: no numeric columns found');
    throw new Error('No numeric columns found for control chart generation');
  }

  try {
    console.log('Processing control charts...');
    
    // Generate a basic control chart for each numeric column
    const controlCharts = {
      controlCharts: numericColumns.map(column => {
        const values = numericalData[column];
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
        );

        return {
          variable: column,
          type: "Individual Values",
          data: {
            values: values,
            ucl: mean + 3 * stdDev,
            lcl: mean - 3 * stdDev,
            centerLine: mean,
            movingRanges: values.slice(1).map((v, i) => Math.abs(v - values[i]))
          },
          interpretation: `Control chart analysis for ${column}`,
          outOfControlPoints: values.map((v, i) => 
            Math.abs(v - mean) > 3 * stdDev ? i : -1
          ).filter(i => i !== -1)
        };
      }),
      summary: `Generated control charts for ${numericColumns.length} variables`
    };

    console.log('Control charts generated successfully');
    return controlCharts;
  } catch (error) {
    console.error('Error generating control charts:', error);
    throw error;
  }
}