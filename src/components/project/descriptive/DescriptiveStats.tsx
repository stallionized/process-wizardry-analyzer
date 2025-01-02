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
      <div className="overflow-y-auto max-h-[400px] relative">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th className="p-2 text-left border bg-white shadow-sm">Variable</th>
              <th className="p-2 text-left border bg-white shadow-sm">Count</th>
              <th className="p-2 text-left border bg-white shadow-sm">Mean</th>
              <th className="p-2 text-left border bg-white shadow-sm">Median</th>
              <th className="p-2 text-left border bg-white shadow-sm">Std Dev</th>
              <th className="p-2 text-left border bg-white shadow-sm">Min</th>
              <th className="p-2 text-left border bg-white shadow-sm">Max</th>
              <th className="p-2 text-left border bg-white shadow-sm">Range</th>
              <th className="p-2 text-left border bg-white shadow-sm">Q1</th>
              <th className="p-2 text-left border bg-white shadow-sm">Q3</th>
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