export function calculateDescriptiveStats(data: number[]) {
  const n = data.length;
  if (n === 0) return null;

  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const sorted = [...data].sort((a, b) => a - b);
  const median = n % 2 === 0 
    ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
    : sorted[Math.floor(n/2)];

  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  return {
    count: n,
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    range: Number(range.toFixed(4)),
    q1: Number(q1.toFixed(4)),
    q3: Number(q3.toFixed(4))
  };
}

export function generateExecutiveSummary(stats: Record<string, any>) {
  const variables = Object.keys(stats);
  if (variables.length === 0) return "No numerical variables found for analysis.";

  let summary = "";
  const highVariabilityVars = variables.filter(variable => 
    (stats[variable].stdDev / stats[variable].mean * 100) > 50
  );
  
  const lowVariabilityVars = variables.filter(variable => 
    (stats[variable].stdDev / stats[variable].mean * 100) <= 25
  );

  if (highVariabilityVars.length > 0) {
    summary += `High variability detected in: ${highVariabilityVars.join(', ')}. `;
  }

  if (lowVariabilityVars.length > 0) {
    summary += `Consistent measurements found in: ${lowVariabilityVars.join(', ')}. `;
  }

  const totalVars = variables.length;
  summary += `Analysis covers ${totalVars} numerical variable${totalVars > 1 ? 's' : ''}.`;

  return summary;
}