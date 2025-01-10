import React from 'react';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
}

export const ChartTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border rounded-lg p-2 shadow-lg">
        <p className="font-medium">{data.identifier}</p>
        <p className="text-sm text-muted-foreground">Value: {data.value.toFixed(2)}</p>
        {data.outOfControl && (
          <p className="text-sm text-destructive font-medium">Out of Control</p>
        )}
      </div>
    );
  }
  return null;
};