import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnovaResult } from './types';

interface AnovaResultsTableProps {
  results: AnovaResult[];
}

export const AnovaResultsTable: React.FC<AnovaResultsTableProps> = ({ results }) => {
  // Helper function to safely format numbers
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(4);
  };

  return (
    <div>
      <h4 className="text-lg font-medium mb-4">ANOVA</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variable</TableHead>
            <TableHead>Compared With</TableHead>
            <TableHead>F-Statistic</TableHead>
            <TableHead>p-Value</TableHead>
            <TableHead>Effect Size</TableHead>
            <TableHead>Significance</TableHead>
            <TableHead>Interpretation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results?.map((result, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{result.variable || 'N/A'}</TableCell>
              <TableCell>{result.comparedWith || 'N/A'}</TableCell>
              <TableCell>{formatNumber(result.fStatistic)}</TableCell>
              <TableCell>{formatNumber(result.pValue)}</TableCell>
              <TableCell>{formatNumber(result.effectSize)}</TableCell>
              <TableCell>{result.significanceLevel || 'N/A'}</TableCell>
              <TableCell className="max-w-md">{result.interpretation || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};