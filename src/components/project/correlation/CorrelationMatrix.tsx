import React, { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Maximize2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatrixContent } from './MatrixContent';
import { GradientKey } from './GradientKey';
import { useMatrixCopy } from '@/hooks/useMatrixCopy';
import { generateCorrelationSummary } from './utils/correlationUtils';

interface CorrelationMatrixProps {
  correlationMatrix: Record<string, Record<string, number>>;
}

export const CorrelationMatrix = ({ correlationMatrix }: CorrelationMatrixProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const matrixRef = useRef<HTMLDivElement>(null);
  const variables = Object.keys(correlationMatrix);
  const correlationSummary = generateCorrelationSummary(correlationMatrix);
  const { copyMatrixToClipboard } = useMatrixCopy(matrixRef);

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={copyMatrixToClipboard}
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
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
      </div>
      
      <div className="p-4 mb-6 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">AI Analysis Summary</h4>
        <p className="text-sm text-muted-foreground">{correlationSummary}</p>
      </div>

      {!isMaximized ? (
        <div ref={matrixRef} className="animate-fade-in flex gap-8">
          <MatrixContent correlationMatrix={correlationMatrix} />
          <GradientKey />
        </div>
      ) : (
        <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-6">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Correlation Matrix</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={copyMatrixToClipboard}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <div ref={matrixRef} className="flex-1 overflow-hidden flex gap-8">
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