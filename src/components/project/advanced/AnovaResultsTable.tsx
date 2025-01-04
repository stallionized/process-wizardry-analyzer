import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AnovaResult {
  variable: string;
  fStatistic: number;
  pValue: number;
  interpretation: string;
}

interface AnovaResultsTableProps {
  results: AnovaResult[];
}

export const AnovaResultsTable: React.FC<AnovaResultsTableProps> = ({ results }) => {
  return (
    <div>
      <h4 className="text-lg font-medium mb-4">ANOVA</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variable</TableHead>
            <TableHead>F-Statistic</TableHead>
            <TableHead>p-Value</TableHead>
            <TableHead>Interpretation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{result.variable}</TableCell>
              <TableCell>{result.fStatistic.toFixed(4)}</TableCell>
              <TableCell>{result.pValue.toFixed(4)}</TableCell>
              <TableCell>{result.interpretation}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};