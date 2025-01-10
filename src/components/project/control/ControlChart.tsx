import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ControlChartData {
  variable: string;
  type: string;
  data: {
    values: number[];
    ucl: number;
    lcl: number;
    centerLine: number;
    movingRanges?: number[];
  };
  interpretation: string;
  outOfControlPoints: number[];
}

interface ControlChartProps {
  chart: ControlChartData;
}

const ControlChart = ({ chart }: ControlChartProps) => {
  const chartData = chart.data.values.map((value, i) => ({
    index: i + 1,
    value,
    outOfControl: chart.outOfControlPoints.includes(i)
  }));

  // Calculate standard deviations
  const standardDeviation = (chart.data.ucl - chart.data.centerLine) / 3;

  // Calculate values for each sigma level
  const sigmaLevels = [
    {
      value: chart.data.centerLine + standardDeviation,
      label: '+1σ',
      color: '#1E3A8A' // dark blue
    },
    {
      value: chart.data.centerLine + 2 * standardDeviation,
      label: '+2σ',
      color: '#3730A3' // dark indigo
    },
    {
      value: chart.data.centerLine + 3 * standardDeviation,
      label: '+3σ',
      color: '#1F2937' // dark gray
    },
    {
      value: chart.data.centerLine - standardDeviation,
      label: '-1σ',
      color: '#1E3A8A' // dark blue
    },
    {
      value: chart.data.centerLine - 2 * standardDeviation,
      label: '-2σ',
      color: '#3730A3' // dark indigo
    },
    {
      value: chart.data.centerLine - 3 * standardDeviation,
      label: '-3σ',
      color: '#1F2937' // dark gray
    }
  ];

  // Calculate distribution of points across standard deviation ranges with indices
  const calculateDistribution = () => {
    const distribution = {
      beyond3: { count: 0, indices: [] as number[] },
      between2and3: { count: 0, indices: [] as number[] },
      between1and2: { count: 0, indices: [] as number[] },
      within1: { count: 0, indices: [] as number[] }
    };
    
    chart.data.values.forEach((value, index) => {
      const deviations = Math.abs((value - chart.data.centerLine) / standardDeviation);
      
      if (deviations > 3) {
        distribution.beyond3.count++;
        distribution.beyond3.indices.push(index + 1);
      } else if (deviations > 2) {
        distribution.between2and3.count++;
        distribution.between2and3.indices.push(index + 1);
      } else if (deviations > 1) {
        distribution.between1and2.count++;
        distribution.between1and2.indices.push(index + 1);
      } else {
        distribution.within1.count++;
        distribution.within1.indices.push(index + 1);
      }
    });

    return [
      { 
        range: "Beyond ±3σ", 
        count: distribution.beyond3.count,
        indices: distribution.beyond3.indices 
      },
      { 
        range: "±2σ to ±3σ", 
        count: distribution.between2and3.count,
        indices: distribution.between2and3.indices 
      },
      { 
        range: "±1σ to ±2σ", 
        count: distribution.between1and2.count,
        indices: distribution.between1and2.indices 
      },
      { 
        range: "Within ±1σ", 
        count: distribution.within1.count,
        indices: distribution.within1.indices 
      }
    ];
  };

  const distribution = calculateDistribution();

  return (
    <div className="space-y-4 border border-border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{chart.variable}</h3>
        <span className="text-sm text-muted-foreground">{chart.type}</span>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            
            {/* Center Line */}
            <ReferenceLine 
              y={chart.data.centerLine} 
              label="CL" 
              stroke="#059669" 
              strokeWidth={2}
            />

            {/* Standard Deviation Lines */}
            {sigmaLevels.map((level, index) => (
              <ReferenceLine
                key={index}
                y={level.value}
                label={level.label}
                stroke={level.color}
                strokeWidth={1}
              />
            ))}

            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              dot={(props: any) => {
                const isOutOfControl = props.payload.outOfControl;
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={isOutOfControl ? 6 : 4}
                    fill={isOutOfControl ? "#ff0000" : "#8884d8"}
                    stroke="none"
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm">{chart.interpretation}</p>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Standard Deviation Distribution</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Range</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distribution.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.range}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{row.count}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-h-[200px] overflow-y-auto">
                          <p className="text-sm font-medium mb-1">Data points:</p>
                          <ul className="space-y-1">
                            {row.indices.map((point) => (
                              <li key={point} className="text-sm">Point {point}</li>
                            ))}
                          </ul>
                        </div>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  {((row.count / chart.data.values.length) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {chart.data.movingRanges && (
        <div className="h-[200px] mt-4">
          <h4 className="text-sm font-medium mb-2">Moving Range Chart</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chart.data.movingRanges.map((value, i) => ({
                index: i + 2,
                value
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ControlChart;
