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
    <div className="matrix-container border rounded-lg">
      <ScrollArea className="h-full w-full" type="always">
        <div className="min-w-max">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="sticky left-0 z-20 w-48 min-w-[12rem] bg-background border-r">
                  Variables
                </TableHead>
                {variables.map((variable) => (
                  <TableHead 
                    key={variable} 
                    className="px-2 text-left whitespace-normal min-w-[8rem]"
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
                    className="sticky left-0 z-10 font-medium w-48 min-w-[12rem] bg-background border-r"
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
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};