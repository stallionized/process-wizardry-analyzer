import React, { useEffect, useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollContainerRef.current) return;

      const scrollAmount = 40;
      const container = scrollContainerRef.current;

      switch (e.key) {
        case 'ArrowUp':
          container.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'ArrowDown':
          container.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'ArrowLeft':
          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'ArrowRight':
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'PageUp':
          container.scrollBy({ top: -container.clientHeight, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'PageDown':
          container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'Home':
          container.scrollTo({ top: 0, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'End':
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Make the container focusable
    if (scrollContainerRef.current) {
      scrollContainerRef.current.tabIndex = 0;
      scrollContainerRef.current.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="matrix-container">
      <div 
        ref={scrollContainerRef}
        className="matrix-scroll-area focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
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