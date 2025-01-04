import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdvancedAnalysisProps {
  analysis: {
    anova: {
      results: Array<{
        variable: string;
        fStatistic: number;
        pValue: number;
        interpretation: string;
      }>;
      summary: string;
    };
    timestamp: string;
  };
}

export const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ analysis }) => {
  const { anova } = analysis;
  
  // Prepare data for the chart
  const chartData = anova.results.map(result => ({
    name: result.variable,
    'F-Statistic': result.fStatistic,
    'p-value': result.pValue
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Statistical Analysis</CardTitle>
          <CardDescription>
            Powered by Claude AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* ANOVA Results Table */}
            <div>
              <h4 className="text-lg font-medium mb-4">ANOVA Results</h4>
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
                  {anova.results.map((result, index) => (
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

            {/* Visualization */}
            <div>
              <h4 className="text-lg font-medium mb-4">Statistical Test Results Visualization</h4>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="F-Statistic" fill="#8884d8" />
                    <Bar dataKey="p-value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-2">Analysis Summary</h4>
              <p className="text-muted-foreground">{anova.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};