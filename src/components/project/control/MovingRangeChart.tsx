import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface MovingRangeChartProps {
  movingRanges: number[];
  identifiers: string[];
}

export const MovingRangeChart = ({ movingRanges, identifiers }: MovingRangeChartProps) => {
  const chartData = movingRanges.map((value, i) => ({
    identifier: identifiers[i + 1],
    value
  }));

  return (
    <div className="h-[200px] mt-4">
      <h4 className="text-sm font-medium mb-2">Moving Range Chart</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="identifier"
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};