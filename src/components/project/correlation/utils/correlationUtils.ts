export const generateCorrelationSummary = (correlationMatrix: Record<string, Record<string, number>>) => {
  const correlations: { variables: [string, string]; correlation: number }[] = [];
  const variables = Object.keys(correlationMatrix);

  // Collect all correlations except self-correlations
  variables.forEach((var1, i) => {
    variables.forEach((var2, j) => {
      if (var1 !== var2) {
        const correlation = correlationMatrix[var1][var2];
        correlations.push({
          variables: [var1, var2],
          correlation,
        });
      }
    });
  });

  // Count positive and negative correlations
  const positiveCorrelations = correlations.filter(c => c.correlation > 0);
  const negativeCorrelations = correlations.filter(c => c.correlation < 0);

  // Find strongest and weakest correlations
  const sortedByAbsolute = [...correlations].sort((a, b) => 
    Math.abs(b.correlation) - Math.abs(a.correlation)
  );
  
  const strongest = sortedByAbsolute[0];
  const weakest = sortedByAbsolute[sortedByAbsolute.length - 1];

  if (correlations.length === 0) {
    return "No correlations were found between different variables.";
  }

  // Generate summary
  const summary = [
    `Analysis found ${positiveCorrelations.length} positive (green) and ${negativeCorrelations.length} negative (red) correlations.`,
    `Strongest correlation: ${strongest.variables[0]} and ${strongest.variables[1]} (${strongest.correlation.toFixed(2)}).`,
    `Weakest correlation: ${weakest.variables[0]} and ${weakest.variables[1]} (${weakest.correlation.toFixed(2)}).`
  ];

  // Add significant correlations summary
  const significantCorrelations = correlations.filter(
    c => Math.abs(c.correlation) > 0.5
  );

  if (significantCorrelations.length > 0) {
    const topCorrelations = significantCorrelations
      .slice(0, 3)
      .map(({ variables: [var1, var2], correlation }) => {
        const strength = Math.abs(correlation) > 0.8 ? "strong" : "moderate";
        const direction = correlation > 0 ? "positive" : "negative";
        return `${var1} and ${var2} show a ${strength} ${direction} correlation (${correlation.toFixed(2)})`;
      });

    summary.push(
      `Notable relationships: ${topCorrelations.join('. ')}${
        significantCorrelations.length > 3
          ? `. Plus ${significantCorrelations.length - 3} other significant correlations found.`
          : '.'
      }`
    );
  }

  return summary.join(' ');
};