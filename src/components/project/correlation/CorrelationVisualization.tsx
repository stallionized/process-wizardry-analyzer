import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface CorrelationVisualizationProps {
  correlationMatrix: Record<string, Record<string, number>>;
}

const getCorrelationColor = (value: number) => {
  const red = value < 0 ? 255 : Math.round(255 * (1 - value));
  const green = value > 0 ? 255 : Math.round(255 * (1 + value));
  return `rgb(${red}, ${green}, 0)`;
};

export const CorrelationVisualization = ({ correlationMatrix }: CorrelationVisualizationProps) => {
  const scatterData = Object.entries(correlationMatrix).flatMap(([variable1, correlations]) =>
    Object.entries(correlations).map(([variable2, correlation]) => ({
      x: variable1,
      y: variable2,
      correlation: Number(correlation.toFixed(2)),
      size: Math.abs(correlation) * 100
    }))
  );

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Correlation Visualization</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis dataKey="x" />
            <YAxis dataKey="y" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background p-2 rounded-lg border shadow-lg">
                      <p className="font-medium">{`${data.x} vs ${data.y}`}</p>
                      <p className="text-sm text-muted-foreground">
                        Correlation: {data.correlation}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={scatterData}>
              {scatterData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={getCorrelationColor(entry.correlation)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};