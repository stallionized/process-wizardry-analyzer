import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CorrelationMatrixProps {
  correlationMatrix: Record<string, Record<string, number>>;
}

const getCorrelationColor = (value: number) => {
  const intensity = Math.abs(value);
  if (value === 1) {
    return '#004d00'; // Darker green for perfect correlation
  } else if (value > 0) {
    return `rgb(${Math.round(255 * (1 - intensity))}, ${Math.round(200 * intensity)}, ${Math.round(255 * (1 - intensity))})`;
  } else {
    return `rgb(${Math.round(200 * intensity)}, ${Math.round(255 * (1 + value))}, ${Math.round(255 * (1 + value))})`;
  }
};

const getTextColor = (correlation: number) => {
  const intensity = Math.abs(correlation);
  return intensity > 0.3 ? 'white' : 'black';
};

const GradientKey = () => (
  <div className="flex items-center gap-4 mt-4">
    <div className="flex items-center gap-2">
      <div className="h-4 w-12 rounded" style={{ 
        background: 'linear-gradient(to right, rgb(200, 0, 0), rgb(255, 255, 255), rgb(0, 77, 0))'
      }} />
      <div className="flex justify-between w-full text-xs font-semibold">
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
                  <TableHead className="w-20 bg-background sticky left-0 z-10">Variables</TableHead>
                  {variables.map((variable) => (
                    <TableHead 
                      key={variable} 
                      className="w-12 px-1 text-center h-32"
                    >
                      <div className="transform -rotate-90 origin-center whitespace-nowrap">
                        {variable}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.map((variable1) => (
                  <TableRow key={variable1}>
                    <TableCell className="font-medium w-20 bg-background sticky left-0">
                      {variable1}
                    </TableCell>
                    {variables.map((variable2) => {
                      const correlation = correlationMatrix[variable1]?.[variable2] || 0;
                      const textColor = getTextColor(correlation);
                      
                      return (
                        <TableCell 
                          key={`${variable1}-${variable2}`}
                          style={{
                            backgroundColor: getCorrelationColor(correlation),
                            width: '3rem',
                            maxWidth: '3rem',
                            minWidth: '3rem',
                          }}
                          className="text-center font-bold text-sm py-2 px-1"
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