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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from 'recharts';

interface ChartData {
  type: string;
  title: string;
  data: Array<Record<string, any>>;
  xKey: string;
  yKeys: string[];
  description?: string;
}

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
      charts: ChartData[];
    };
    timestamp: string;
  };
}

const ChartComponent: React.FC<{ chartData: ChartData }> = ({ chartData }) => {
  const { type, data, xKey, yKeys, title, description } = chartData;

  const renderChart = () => {
    const commonProps = {
      width: "100%",
      height: "100%",
      data: data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type.toLowerCase()) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </LineChart>
        );
      
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Scatter 
                key={key} 
                name={key} 
                data={data} 
                fill={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </ScatterChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                fill={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
                stroke={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </AreaChart>
        );
      
      default:
        return (
          <BarChart {...commonProps}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={`hsl(${index * (360 / yKeys.length)}, 70%, 50%)`} 
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">{title}</h4>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="h-[400px] w-full">
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ analysis }) => {
  const { anova } = analysis;
  
  // Prepare data for the default ANOVA chart
  const defaultChartData = {
    type: 'bar',
    title: 'ANOVA Test Results',
    data: anova.results.map(result => ({
      name: result.variable,
      'F-Statistic': result.fStatistic,
      'p-value': result.pValue
    })),
    xKey: 'name',
    yKeys: ['F-Statistic', 'p-value']
  };

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

            {/* Default ANOVA Visualization */}
            <ChartComponent chartData={defaultChartData} />

            {/* Additional Charts from Claude */}
            {anova.charts && anova.charts.length > 0 && (
              <div className="space-y-8">
                <h4 className="text-lg font-medium">Additional Statistical Visualizations</h4>
                {anova.charts.map((chartData, index) => (
                  <ChartComponent key={index} chartData={chartData} />
                ))}
              </div>
            )}

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