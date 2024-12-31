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
    <div className="border rounded-lg relative">
      <ScrollArea className="h-[500px] w-full" type="always">
        <div className="min-w-max overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-background">
              <TableRow>
                <TableHead className="w-48 bg-background sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Variables
                </TableHead>
                {variables.map((variable) => (
                  <TableHead 
                    key={variable} 
                    className="w-32 px-2 text-left whitespace-normal min-w-[8rem]"
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
                  <TableHead 
                    className="font-medium w-48 bg-background sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    title={variable1}
                  >
                    <div className="max-w-[12rem] break-words">
                      {truncateText(variable1)}
                    </div>
                  </TableHead>
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
        <ScrollBar orientation="horizontal" className="h-3" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};