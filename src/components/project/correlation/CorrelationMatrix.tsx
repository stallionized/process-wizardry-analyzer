import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CorrelationMatrixProps {
  correlationMatrix: Record<string, Record<string, number>>;
}

const getCorrelationColor = (value: number) => {
  // Convert correlation value to a color on a red-to-green scale
  const red = value < 0 ? 255 : Math.round(255 * (1 - value));
  const green = value > 0 ? 255 : Math.round(255 * (1 + value));
  return `rgb(${red}, ${green}, 0)`;
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
              <TableHead>Variables</TableHead>
              {variables.map((variable) => (
                <TableHead key={variable}>{variable}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable1) => (
              <TableRow key={variable1}>
                <TableCell className="font-medium">{variable1}</TableCell>
                {variables.map((variable2) => {
                  const correlation = correlationMatrix[variable1]?.[variable2] || 0;
                  const opacity = Math.abs(correlation);
                  return (
                    <TableCell 
                      key={`${variable1}-${variable2}`}
                      style={{
                        backgroundColor: getCorrelationColor(correlation),
                        opacity: opacity * 0.8 + 0.2, // Minimum opacity of 0.2
                        color: Math.abs(correlation) > 0.5 ? 'white' : 'black',
                        transition: 'all 0.2s'
                      }}
                      className="text-center"
                    >
                      {correlation.toFixed(2)}
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