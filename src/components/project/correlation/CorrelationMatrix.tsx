import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CorrelationMatrixProps {
  correlationMatrix: Record<string, Record<string, number>>;
}

const getCorrelationColor = (value: number) => {
  // Convert correlation value to a darker red-to-green scale
  const intensity = Math.abs(value);
  if (value === 1) {
    return '#00A300'; // Darker green for perfect correlation
  } else if (value > 0) {
    return `rgb(${Math.round(255 * (1 - intensity))}, ${Math.round(200 * intensity)}, 0)`;
  } else {
    return `rgb(${Math.round(200 * intensity)}, ${Math.round(255 * (1 + value))}, 0)`;
  }
};

export const CorrelationMatrix = ({ correlationMatrix }: CorrelationMatrixProps) => {
  const variables = Object.keys(correlationMatrix);

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Correlation Matrix</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Variables</TableHead>
              {variables.map((variable) => (
                <TableHead key={variable} className="w-32 px-2 text-center">
                  {variable}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable1) => (
              <TableRow key={variable1}>
                <TableCell className="font-medium w-32">{variable1}</TableCell>
                {variables.map((variable2) => {
                  const correlation = correlationMatrix[variable1]?.[variable2] || 0;
                  const opacity = Math.abs(correlation);
                  return (
                    <TableCell 
                      key={`${variable1}-${variable2}`}
                      style={{
                        backgroundColor: getCorrelationColor(correlation),
                        opacity: opacity * 0.9 + 0.1, // Minimum opacity of 0.1 for better visibility
                        width: '8rem', // Fixed width for uniform sizing
                        maxWidth: '8rem',
                        minWidth: '8rem',
                      }}
                      className="text-center font-medium text-sm py-2 px-2"
                    >
                      <span className={correlation === 1 ? 'text-white' : Math.abs(correlation) > 0.5 ? 'text-white' : 'text-black'}>
                        {correlation.toFixed(2)}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};