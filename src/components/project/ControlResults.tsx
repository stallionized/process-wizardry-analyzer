import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
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

interface ControlResultsProps {
  projectId: string;
}

interface ControlChart {
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

interface ControlChartResults {
  controlCharts: ControlChart[];
  summary: string;
}

const ControlResults = ({ projectId }: ControlResultsProps) => {
  const { data: analysisResults, isLoading, error } = useQuery({
    queryKey: ['analysis', projectId],
    queryFn: async () => {
      console.log('Fetching control chart results for project:', projectId);
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching control chart results:', error);
        throw error;
      }

      if (!data) {
        console.log('No control chart results found');
        return null;
      }

      console.log('Control chart results found:', data);
      
      const isControlChartResults = (data: any): data is { control_charts: ControlChartResults } => {
        return (
          data.control_charts &&
          typeof data.control_charts === 'object' &&
          Array.isArray(data.control_charts.controlCharts) &&
          typeof data.control_charts.summary === 'string'
        );
      };

      if (!isControlChartResults(data)) {
        console.error('Invalid control chart data structure');
        return null;
      }

      return data.control_charts;
    },
    refetchInterval: (data) => (!data ? 5000 : false),
  });

  const generateAISummary = (charts: ControlChart[]) => {
    const totalCharts = charts.length;
    const outOfControlCharts = charts.filter(chart => chart.outOfControlPoints.length > 0);
    const inControlCharts = charts.filter(chart => chart.outOfControlPoints.length === 0);
    
    const outOfControlReasons = outOfControlCharts.map(chart => ({
      variable: chart.variable,
      points: chart.outOfControlPoints.length,
      interpretation: chart.interpretation
    }));

    return {
      total: totalCharts,
      outOfControl: outOfControlCharts.length,
      inControl: inControlCharts.length,
      reasons: outOfControlReasons
    };
  };

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading control chart results...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">Control Chart Results</h2>
        <p className="text-destructive">
          Error loading control chart results. Please try again later.
        </p>
      </Card>
    );
  }

  if (!analysisResults) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">Control Chart Results</h2>
        <p className="text-muted-foreground">
          Control chart results will appear here after processing your uploaded files.
        </p>
      </Card>
    );
  }

  const aiSummary = analysisResults.controlCharts ? generateAISummary(analysisResults.controlCharts) : null;

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">Control Chart Results</h2>
      
      {aiSummary && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg p-6 border border-blue-200 dark:border-blue-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <AlertCircle className="h-5 w-5" />
            AI Summary Analysis
          </h3>
          <div className="space-y-3 text-sm">
            <p>Analysis of {aiSummary.total} control chart{aiSummary.total !== 1 ? 's' : ''} shows:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>{aiSummary.inControl} process{aiSummary.inControl !== 1 ? 'es are' : ' is'} in statistical control</li>
              <li>{aiSummary.outOfControl} process{aiSummary.outOfControl !== 1 ? 'es show' : ' shows'} signs of being out of control</li>
            </ul>
            {aiSummary.reasons.length > 0 && (
              <div className="mt-4">
                <p className="font-medium mb-2">Out of Control Processes Explained:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  {aiSummary.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="font-medium">{reason.variable}</span>: {reason.interpretation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {analysisResults.summary && (
        <div className="bg-muted/50 p-4 rounded-lg mb-8">
          <p className="text-sm text-muted-foreground">{analysisResults.summary}</p>
        </div>
      )}
      
      {analysisResults.controlCharts?.map((chart, index) => {
        const chartData = chart.data.values.map((value, i) => ({
          index: i + 1,
          value,
          outOfControl: chart.outOfControlPoints.includes(i)
        }));

        return (
          <div key={index} className="space-y-4 border border-border rounded-lg p-4">
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
                  <ReferenceLine y={chart.data.ucl} label="UCL" stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={chart.data.centerLine} label="CL" stroke="green" />
                  <ReferenceLine y={chart.data.lcl} label="LCL" stroke="red" strokeDasharray="3 3" />
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
      })}
    </Card>
  );
};

export default ControlResults;
