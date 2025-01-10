import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AISummary from './control/AISummary';
import ControlChart from './control/ControlChart';
import LoadingState from './control/LoadingState';

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

  if (isLoading) {
    return <LoadingState />;
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

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">Control Chart Results</h2>
      
      {analysisResults.controlCharts && (
        <AISummary controlCharts={analysisResults.controlCharts} />
      )}

      {analysisResults.summary && (
        <div className="bg-muted/50 p-4 rounded-lg mb-8">
          <p className="text-sm text-muted-foreground">{analysisResults.summary}</p>
        </div>
      )}
      
      {analysisResults.controlCharts?.map((chart, index) => (
        <ControlChart key={index} chart={chart} />
      ))}
    </Card>
  );
};

export default ControlResults;