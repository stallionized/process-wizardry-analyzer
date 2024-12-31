import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CorrelationCell } from './CorrelationCell';

interface MatrixContentProps {
  correlationMatrix: Record<string, Record<string, number>>;
}

const truncateText = (text: string, maxLength: number = 20) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const MatrixContent = ({ correlationMatrix }: MatrixContentProps) => {
  const variables = Object.keys(correlationMatrix);

  return (
    <div className="matrix-container border rounded-lg relative">
      <ScrollArea className="h-[500px] w-full" type="scroll">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Top-left corner cell - needs to be sticky in both directions */}
                <TableHead 
                  className="w-48 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 
                            sticky left-0 z-30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  Variables
                </TableHead>
                {/* Header row cells - sticky top */}
                {variables.map((variable) => (
                  <TableHead 
                    key={variable} 
                    className="w-32 px-2 text-left whitespace-normal min-w-[8rem] 
                              sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
                              z-20"
                    title={variable}
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
                  {/* First column cells - sticky left */}
                  <TableHead 
                    className="font-medium w-48 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 
                              sticky left-0 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    title={variable1}
                  >
                    <div className="max-w-[12rem] break-words">
                      {truncateText(variable1)}
                    </div>
                  </TableHead>
                  {/* Data cells */}
                  {variables.map((variable2) => (
                    <CorrelationCell
                      key={`${variable1}-${variable2}`}
                      correlation={correlationMatrix[variable1]?.[variable2] || 0}
                    />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};