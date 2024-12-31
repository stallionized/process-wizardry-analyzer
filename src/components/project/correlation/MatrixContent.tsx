import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <ScrollArea className="h-[500px]" type="always">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="sticky left-0 top-0 z-30 w-48 border-r bg-background"
                >
                  Variables
                </TableHead>
                {variables.map((variable) => (
                  <TableHead 
                    key={variable} 
                    className="sticky top-0 z-20 w-32 px-2 text-left whitespace-normal min-w-[8rem] bg-background"
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
                    className="sticky left-0 z-10 font-medium w-48 border-r bg-background"
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
      </ScrollArea>
    </div>
  );
};