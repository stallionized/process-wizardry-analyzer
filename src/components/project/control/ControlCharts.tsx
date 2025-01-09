import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface ControlChartData {
  variable: string;
  chartType: string;
  centerLine: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  data: {
    index: number;
    value: number;
    isOutOfControl: boolean;
    deviationLevel: number;
  }[];
  outOfControlPoints: {
    ranges: {
      min: number;
      max: number;
      volume: number;
      values: number[];
    }[];
  };
  interpretation: string;
}

interface ControlChartsProps {
  charts: ControlChartData[];
}

export const ControlCharts: React.FC<ControlChartsProps> = ({ charts }) => {
  if (!charts || charts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No control charts available. Upload data to generate control charts.
      </div>
    );
  }

  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={payload.isOutOfControl ? 6 : 4}
        fill={payload.isOutOfControl ? '#ff0000' : '#8884d8'}
      />
    );
  };

  return (
    <div className="space-y-8">
      {charts.map((chart, index) => (
        <div key={`${chart.variable}-${index}`} className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">
            {chart.variable} - {chart.chartType} Chart
          </h3>
          
          <div className="h-[400px] w-full">
            <LineChart
              width={800}
              height={400}
              data={chart.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              
              <ReferenceLine
                y={chart.centerLine}
                label="CL"
                stroke="#888"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={chart.upperControlLimit}
                label="UCL"
                stroke="#ff0000"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={chart.lowerControlLimit}
                label="LCL"
                stroke="#ff0000"
                strokeDasharray="3 3"
              />
              
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                dot={renderDot}
              />
            </LineChart>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Out of Control Points</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Range</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chart.outOfControlPoints.ranges.map((range, rangeIndex) => (
                  <TableRow key={rangeIndex}>
                    <TableCell>
                      {range.min}σ to {range.max}σ
                    </TableCell>
                    <TableCell>
                      <HoverCard>
                        <HoverCardTrigger className="cursor-help">
                          {range.volume}
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Values in this range:</h4>
                            <div className="text-sm text-muted-foreground">
                              {range.values.join(', ')}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{chart.interpretation}</p>
          </div>
        </div>
      ))}
    </div>
  );
};