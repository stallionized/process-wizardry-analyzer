import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from 'recharts';
import { ChartData } from './types';

export const ChartComponent: React.FC<{ chartData: ChartData }> = ({ chartData }) => {
  const { type, data, xKey, yKeys, title, description } = chartData;

  const commonProps = {
    width: 500,
    height: 300,
    data: data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  };

  const renderChart = () => {
    switch (type.toLowerCase()) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </LineChart>
        );
      
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Scatter 
                key={key} 
                name={key} 
                data={data} 
                fill={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </ScatterChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                fill={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
                stroke={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </AreaChart>
        );
      
      default:
        return (
          <BarChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">{title}</h4>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="h-[400px] w-full">
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};