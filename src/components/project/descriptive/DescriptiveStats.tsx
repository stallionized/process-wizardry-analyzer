import React from 'react';

interface DescriptiveStatsProps {
  stats: Record<string, {
    count: number;
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    min: number;
    max: number;
    range: number;
    q1: number;
    q3: number;
  }>;
}

export const DescriptiveStats: React.FC<DescriptiveStatsProps> = ({ stats }) => {
  const variables = Object.keys(stats);

  if (variables.length === 0) {
    return (
      <div>
        <p className="text-muted-foreground">
          No numerical variables found for statistical analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-background">
            <tr className="bg-muted">
              <th className="p-2 text-left border">Variable</th>
              <th className="p-2 text-left border">Count</th>
              <th className="p-2 text-left border">Mean</th>
              <th className="p-2 text-left border">Median</th>
              <th className="p-2 text-left border">Std Dev</th>
              <th className="p-2 text-left border">Min</th>
              <th className="p-2 text-left border">Max</th>
              <th className="p-2 text-left border">Range</th>
              <th className="p-2 text-left border">Q1</th>
              <th className="p-2 text-left border">Q3</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable) => (
              <tr key={variable} className="hover:bg-muted/50">
                <td className="p-2 border font-medium">{variable}</td>
                <td className="p-2 border">{stats[variable].count.toFixed(0)}</td>
                <td className="p-2 border">{stats[variable].mean.toFixed(4)}</td>
                <td className="p-2 border">{stats[variable].median.toFixed(4)}</td>
                <td className="p-2 border">{stats[variable].stdDev.toFixed(4)}</td>
                <td className="p-2 border">{stats[variable].min.toFixed(4)}</td>
                <td className="p-2 border">{stats[variable].max.toFixed(4)}</td>
                <td className="p-2 border">{stats[variable].range.toFixed(4)}</td>
                <td className="p-2 border">{stats[variable].q1.toFixed(4)}</td>
                <td className="p-2 border">{stats[variable].q3.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};