import React from 'react';
import { TableCell } from '@/components/ui/table';

interface CorrelationCellProps {
  correlation: number;
}

const getCorrelationColor = (value: number) => {
  const intensity = Math.abs(value);
  if (value === 1) {
    return '#004d00'; // Dark green for perfect positive correlation
  } else if (value === -1) {
    return '#8b0000'; // Dark red for perfect negative correlation
  } else if (value > 0) {
    // Gradient from white to dark green
    return `rgb(${Math.round(255 * (1 - intensity))}, ${Math.round(255 * (1 - intensity * 0.5))}, ${Math.round(255 * (1 - intensity))})`;
  } else {
    // Gradient from white to dark red
    return `rgb(${Math.round(255 * (1 - intensity * 0.5))}, ${Math.round(255 * (1 - intensity))}, ${Math.round(255 * (1 - intensity))})`;
  }
};

const getTextColor = (correlation: number) => {
  const intensity = Math.abs(correlation);
  return intensity > 0.3 ? 'white' : 'black';
};

export const CorrelationCell = ({ correlation }: CorrelationCellProps) => {
  const textColor = getTextColor(correlation);
  
  return (
    <TableCell 
      style={{
        backgroundColor: getCorrelationColor(correlation),
        width: '8rem',
        maxWidth: '8rem',
        minWidth: '8rem',
      }}
      className="text-center font-bold text-sm py-2 px-1 whitespace-nowrap"
    >
      <span style={{ color: textColor }}>
        {correlation.toFixed(2)}
      </span>
    </TableCell>
  );
};