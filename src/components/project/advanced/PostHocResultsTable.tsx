import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PostHocResult } from './types';

interface PostHocResultsTableProps {
  results: PostHocResult[];
}

export const PostHocResultsTable: React.FC<PostHocResultsTableProps> = ({ results }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Group 1</TableHead>
          <TableHead>Group 2</TableHead>
          <TableHead>Mean Difference</TableHead>
          <TableHead>p-Value</TableHead>
          <TableHead>Significance</TableHead>
          <TableHead>Interpretation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result, index) => (
          <TableRow key={index}>
            <TableCell>{result.group1}</TableCell>
            <TableCell>{result.group2}</TableCell>
            <TableCell>{result.meanDifference.toFixed(4)}</TableCell>
            <TableCell>{result.pValue.toFixed(4)}</TableCell>
            <TableCell>{result.significant ? 'Significant' : 'Not Significant'}</TableCell>
            <TableCell className="max-w-md">{result.interpretation}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};