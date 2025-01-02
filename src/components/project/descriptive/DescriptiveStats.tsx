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
        <h3 className="text-lg font-medium mb-3">Descriptive Statistics</h3>
        <p className="text-muted-foreground">
          No numerical variables found for statistical analysis.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Descriptive Statistics</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
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
                <td className="p-2 border">{stats[variable].count}</td>
                <td className="p-2 border">{stats[variable].mean}</td>
                <td className="p-2 border">{stats[variable].median}</td>
                <td className="p-2 border">{stats[variable].stdDev}</td>
                <td className="p-2 border">{stats[variable].min}</td>
                <td className="p-2 border">{stats[variable].max}</td>
                <td className="p-2 border">{stats[variable].range}</td>
                <td className="p-2 border">{stats[variable].q1}</td>
                <td className="p-2 border">{stats[variable].q3}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};