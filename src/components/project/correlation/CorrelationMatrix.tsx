import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface CorrelationMatrixProps {
  correlationMatrix: Record<string, Record<string, number>>;
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

const GradientKey = () => (
  <div className="flex flex-col items-start gap-2 mt-6 ml-32">
    <span className="text-sm font-medium">Correlation Strength</span>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="h-6 w-48 rounded" style={{ 
          background: 'linear-gradient(to right, #8b0000, #ffffff, #004d00)',
          border: '1px solid #e2e8f0'
        }} />
        <div className="flex justify-between w-48 text-xs font-medium">
          <span>-1.0</span>
          <span>0.0</span>
          <span>1.0</span>
        </div>
      </div>
    </div>
  </div>
);

const generateCorrelationSummary = (correlationMatrix: Record<string, Record<string, number>>) => {
  const significantCorrelations: { variables: [string, string]; correlation: number }[] = [];
  const variables = Object.keys(correlationMatrix);

  // Collect significant correlations (absolute value > 0.5)
  variables.forEach((var1, i) => {
    variables.slice(i + 1).forEach((var2) => {
      const correlation = correlationMatrix[var1][var2];
      if (Math.abs(correlation) > 0.5 && var1 !== var2) {
        significantCorrelations.push({
          variables: [var1, var2],
          correlation,
        });
      }
    });
  });

  // Sort by absolute correlation value
  significantCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  if (significantCorrelations.length === 0) {
    return "No significant correlations were found between variables (correlation > 0.5 or < -0.5).";
  }

  const correlationDescriptions = significantCorrelations.map(({ variables: [var1, var2], correlation }) => {
    const strength = Math.abs(correlation) > 0.8 ? "strong" : "moderate";
    const direction = correlation > 0 ? "positive" : "negative";
    return `${var1} and ${var2} show a ${strength} ${direction} correlation (${correlation.toFixed(2)})`;
  });

  const topCorrelations = correlationDescriptions.slice(0, 3);
  return `Key findings: ${topCorrelations.join('. ')}. ${
    correlationDescriptions.length > 3
      ? ` Plus ${correlationDescriptions.length - 3} other significant correlations found.`
      : ''
  }`;
};

export const CorrelationMatrix = ({ correlationMatrix }: CorrelationMatrixProps) => {
  const variables = Object.keys(correlationMatrix);
  const correlationSummary = generateCorrelationSummary(correlationMatrix);

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Correlation Matrix</h3>
      
      <Card className="p-4 mb-6 bg-muted/50">
        <h4 className="font-medium mb-2">AI Analysis Summary</h4>
        <p className="text-sm text-muted-foreground">{correlationSummary}</p>
      </Card>

      <div className="border rounded-lg">
        <ScrollArea className="h-[500px] w-full">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 bg-background sticky left-0 z-10">Variables</TableHead>
                  {variables.map((variable) => (
                    <TableHead 
                      key={variable} 
                      className="w-32 px-1 text-center h-32"
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
                    <TableCell className="font-medium w-32 bg-background sticky left-0">
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
                            width: '8rem',
                            maxWidth: '8rem',
                            minWidth: '8rem',
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