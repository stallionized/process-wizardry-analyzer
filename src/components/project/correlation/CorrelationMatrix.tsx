import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatrixContent } from './MatrixContent';
import { GradientKey } from './GradientKey';

interface CorrelationMatrixProps {
  correlationMatrix: Record<string, Record<string, number>>;
}

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
  const [isMaximized, setIsMaximized] = useState(false);
  const variables = Object.keys(correlationMatrix);
  const correlationSummary = generateCorrelationSummary(correlationMatrix);

  if (variables.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-3">Correlation Matrix</h3>
        <p className="text-muted-foreground">
          No correlation data available. Please ensure your uploaded files contain numerical data for analysis.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Correlation Matrix</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsMaximized(true)}
        >
          <Maximize2 className="h-4 w-4" />
          Maximize
        </Button>
      </div>
      
      <div className="p-4 mb-6 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">AI Analysis Summary</h4>
        <p className="text-sm text-muted-foreground">{correlationSummary}</p>
      </div>

      {!isMaximized ? (
        <div className="animate-fade-in">
          <MatrixContent correlationMatrix={correlationMatrix} />
          <GradientKey />
        </div>
      ) : (
        <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-6 animate-scale-in">
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Correlation Matrix</h2>
              <div className="flex-1 overflow-hidden">
                <MatrixContent correlationMatrix={correlationMatrix} />
                <GradientKey />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
