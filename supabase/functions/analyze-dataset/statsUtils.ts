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

  const totalVars = variables.length;
  const summary = `Descriptive statistics help us understand our data by finding things like averages and ranges. They tell us what's typical and how spread out our numbers are. We analyzed ${totalVars} different types of measurements in this dataset.`;

  return summary;
}
