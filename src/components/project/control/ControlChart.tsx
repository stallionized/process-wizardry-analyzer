import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';

interface ControlChartData {
  variable: string;
  type: string;
  data: {
    values: number[];
    ucl: number;
    lcl: number;
    centerLine: number;
    movingRanges?: number[];
  };
  interpretation: string;
  outOfControlPoints: number[];
}

interface ControlChartProps {
  chart: ControlChartData;
}

const ControlChart = ({ chart }: ControlChartProps) => {
  const chartData = chart.data.values.map((value, i) => ({
    index: i + 1,
    value,
    outOfControl: chart.outOfControlPoints.includes(i)
  }));

  return (
    <div className="space-y-4 border border-border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{chart.variable}</h3>
        <span className="text-sm text-muted-foreground">{chart.type}</span>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <ReferenceLine y={chart.data.ucl} label="UCL" stroke="red" strokeDasharray="3 3" />
            <ReferenceLine y={chart.data.centerLine} label="CL" stroke="green" />
            <ReferenceLine y={chart.data.lcl} label="LCL" stroke="red" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              dot={(props: any) => {
                const isOutOfControl = props.payload.outOfControl;
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={isOutOfControl ? 6 : 4}
                    fill={isOutOfControl ? "#ff0000" : "#8884d8"}
                    stroke="none"
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm">{chart.interpretation}</p>
      </div>

      {chart.data.movingRanges && (
        <div className="h-[200px] mt-4">
          <h4 className="text-sm font-medium mb-2">Moving Range Chart</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chart.data.movingRanges.map((value, i) => ({
                index: i + 2,
                value
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ControlChart;