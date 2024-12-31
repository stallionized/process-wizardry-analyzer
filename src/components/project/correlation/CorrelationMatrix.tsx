import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CorrelationMatrixProps {
  correlationMatrix: Record<string, Record<string, number>>;
}

const getCorrelationColor = (value: number) => {
  const intensity = Math.abs(value);
  if (value === 1) {
    return '#006400'; // Darker green for perfect correlation
  } else if (value > 0) {
    return `rgb(${Math.round(100 * (1 - intensity))}, ${Math.round(120 * intensity)}, 0)`;
  } else {
    return `rgb(${Math.round(120 * intensity)}, ${Math.round(100 * (1 + value))}, 0)`;
  }
};

const GradientKey = () => (
  <div className="flex items-center gap-4 mt-4">
    <div className="flex items-center gap-2">
      <div className="h-4 w-12 rounded" style={{ background: 'linear-gradient(to right, rgb(120, 0, 0), rgb(100, 100, 100), rgb(0, 120, 0))' }} />
      <div className="flex justify-between w-full text-xs">
        <span>-1</span>
        <span>0</span>
        <span>1</span>
      </div>
    </div>
    <span className="text-xs text-muted-foreground">Correlation Strength</span>
  </div>
);

export const CorrelationMatrix = ({ correlationMatrix }: CorrelationMatrixProps) => {
  const variables = Object.keys(correlationMatrix);

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Correlation Matrix</h3>
      <div className="border rounded-lg">
        <ScrollArea className="h-[500px] w-full">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 bg-background sticky left-0 z-10">Variables</TableHead>
                  {variables.map((variable) => (
                    <TableHead key={variable} className="w-16 px-2 text-center">
                      {variable}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.map((variable1) => (
                  <TableRow key={variable1}>
                    <TableCell className="font-medium w-24 bg-background sticky left-0">
                      {variable1}
                    </TableCell>
                    {variables.map((variable2) => {
                      const correlation = correlationMatrix[variable1]?.[variable2] || 0;
                      const opacity = Math.abs(correlation);
                      const textColor = Math.abs(correlation) > 0.3 ? 'white' : 'black';
                      
                      return (
                        <TableCell 
                          key={`${variable1}-${variable2}`}
                          style={{
                            backgroundColor: getCorrelationColor(correlation),
                            opacity: opacity * 0.9 + 0.1,
                            width: '4rem',
                            maxWidth: '4rem',
                            minWidth: '4rem',
                          }}
                          className="text-center font-medium text-sm py-2 px-1"
                        >
                          <span style={{ color: textColor }}>
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
        </ScrollArea>
      </div>
      <GradientKey />
    </div>
  );
};