import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    <div className="matrix-container">
      <div className="matrix-scroll-area">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="matrix-first-column w-48 min-w-[12rem]">
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
                  className="matrix-first-column font-medium w-48 min-w-[12rem]"
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
    </div>
  );
};