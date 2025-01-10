import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DistributionPoint {
  value: number;
  identifier: string;
}

interface DistributionRow {
  range: string;
  count: number;
  points: DistributionPoint[];
}

interface DistributionTableProps {
  distribution: DistributionRow[];
  totalPoints: number;
}

export const DistributionTable = ({ distribution, totalPoints }: DistributionTableProps) => {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Standard Deviation Distribution</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Range</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {distribution.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.range}</TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">{row.count}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-h-[200px] overflow-y-auto">
                        <p className="text-sm font-medium mb-1">Data points:</p>
                        <ul className="space-y-1">
                          {row.points.map((point, i) => (
                            <li key={i} className="text-sm">
                              {point.identifier}: {point.value.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                {((row.count / totalPoints) * 100).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};