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

  let summary = "Key Findings from Data Analysis:\n\n";

  variables.forEach(variable => {
    const stat = stats[variable];
    const variability = stat.stdDev / stat.mean * 100;
    
    summary += `${variable}:\n`;
    summary += `- Typical value (median): ${stat.median.toFixed(2)}\n`;
    summary += `- Range: ${stat.min.toFixed(2)} to ${stat.max.toFixed(2)}\n`;
    
    if (variability > 50) {
      summary += "- Shows high variability in measurements\n";
    } else if (variability > 25) {
      summary += "- Shows moderate variability in measurements\n";
    } else {
      summary += "- Shows consistent measurements\n";
    }
    summary += "\n";
  });

  return summary;
}