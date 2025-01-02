export function calculateCorrelationMatrix(numericalData: Record<string, number[]>) {
  const correlationMatrix: Record<string, Record<string, number>> = {};
  const columns = Object.keys(numericalData);

  columns.forEach(col1 => {
    correlationMatrix[col1] = {};
    columns.forEach(col2 => {
      const values1 = numericalData[col1];
      const values2 = numericalData[col2];
      
      const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
      const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
      
      let covariance = 0;
      let variance1 = 0;
      let variance2 = 0;
      
      for (let i = 0; i < values1.length; i++) {
        const diff1 = values1[i] - mean1;
        const diff2 = values2[i] - mean2;
        covariance += diff1 * diff2;
        variance1 += diff1 * diff1;
        variance2 += diff2 * diff2;
      }
      
      const correlation = covariance / Math.sqrt(variance1 * variance2);
      correlationMatrix[col1][col2] = Number(correlation.toFixed(4));
    });
  });

  return correlationMatrix;
}