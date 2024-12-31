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
  const correlations: { variables: [string, string]; correlation: number }[] = [];
  const variables = Object.keys(correlationMatrix);

  // Collect all correlations except self-correlations
  variables.forEach((var1, i) => {
    variables.forEach((var2, j) => {
      if (var1 !== var2) {
        const correlation = correlationMatrix[var1][var2];
        correlations.push({
          variables: [var1, var2],
          correlation,
        });
      }
    });
  });

  // Count positive and negative correlations
  const positiveCorrelations = correlations.filter(c => c.correlation > 0);
  const negativeCorrelations = correlations.filter(c => c.correlation < 0);

  // Find strongest and weakest correlations
  const sortedByAbsolute = [...correlations].sort((a, b) => 
    Math.abs(b.correlation) - Math.abs(a.correlation)
  );
  
  const strongest = sortedByAbsolute[0];
  const weakest = sortedByAbsolute[sortedByAbsolute.length - 1];

  if (correlations.length === 0) {
    return "No correlations were found between different variables.";
  }

  // Generate summary
  const summary = [
    `Analysis found ${positiveCorrelations.length} positive (green) and ${negativeCorrelations.length} negative (red) correlations.`,
    `Strongest correlation: ${strongest.variables[0]} and ${strongest.variables[1]} (${strongest.correlation.toFixed(2)}).`,
    `Weakest correlation: ${weakest.variables[0]} and ${weakest.variables[1]} (${weakest.correlation.toFixed(2)}).`
  ];

  // Add significant correlations summary
  const significantCorrelations = correlations.filter(
    c => Math.abs(c.correlation) > 0.5
  );

  if (significantCorrelations.length > 0) {
    const topCorrelations = significantCorrelations
      .slice(0, 3)
      .map(({ variables: [var1, var2], correlation }) => {
        const strength = Math.abs(correlation) > 0.8 ? "strong" : "moderate";
        const direction = correlation > 0 ? "positive" : "negative";
        return `${var1} and ${var2} show a ${strength} ${direction} correlation (${correlation.toFixed(2)})`;
      });

    summary.push(
      `Notable relationships: ${topCorrelations.join('. ')}${
        significantCorrelations.length > 3
          ? `. Plus ${significantCorrelations.length - 3} other significant correlations found.`
          : '.'
      }`
    );
  }

  return summary.join(' ');
};

export const CorrelationMatrix = ({ correlationMatrix }: CorrelationMatrixProps) => {
  const variables = Object.keys(correlationMatrix);
  const correlationSummary = generateCorrelationSummary(correlationMatrix);

  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Correlation Matrix</h3>
      
      <Card className="p-4 mb-6 bg-muted/50">
        <h4 className="font-medium mb-2">AI Analysis Summary</h4>
        <p className="text-sm text-muted-foreground">{correlationSummary}</p>
      </Card>

      <div className="border rounded-lg">
        <ScrollArea className="h-[500px] rounded-md" type="always">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 bg-background sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Variables
                  </TableHead>
                  {variables.map((variable) => (
                    <TableHead 
                      key={variable} 
                      className="w-32 px-2 text-left whitespace-normal min-w-[8rem]"
                      title={variable} // Show full text on hover
                    >
                      <div className="max-w-[8rem] break-words">
                        {truncateText(variable)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.map((variable1) => (
                  <TableRow key={variable1}>
                    <TableCell 
                      className="font-medium w-48 bg-background sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      title={variable1} // Show full text on hover
                    >
                      <div className="max-w-[12rem] break-words">
                        {truncateText(variable1)}
                      </div>
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