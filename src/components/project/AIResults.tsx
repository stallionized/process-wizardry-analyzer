import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { AnalysisResults } from '@/types';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AIResultsProps {
  projectId: string;
}

const AIResults = ({ projectId }: AIResultsProps) => {
  const { data: analysisResults, isLoading, error } = useQuery({
    queryKey: ['analysis', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        return null;
      }
      
      // Add type guard to ensure the results match our expected structure
      const results = data?.results;
      if (!results || typeof results !== 'object') {
        throw new Error('Invalid analysis results format');
      }

      // Cast to unknown first, then check if it matches our expected structure
      const typedResults = results as unknown;
      
      // Type guard function to verify the shape matches AnalysisResults
      const isAnalysisResults = (value: unknown): value is AnalysisResults => {
        const candidate = value as Partial<AnalysisResults>;
        return (
          typeof candidate === 'object' &&
          candidate !== null &&
          'correlationMatrix' in candidate &&
          'mappings' in candidate &&
          typeof candidate.correlationMatrix === 'object' &&
          typeof candidate.mappings === 'object'
        );
      };

      if (!isAnalysisResults(typedResults)) {
        throw new Error('Invalid analysis results structure');
      }

      return typedResults;
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Analyzing data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-destructive">
          Error loading analysis results. Please try again later.
        </p>
      </Card>
    );
  }

  if (!analysisResults) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-muted-foreground">
          Analysis results will appear here after processing your uploaded files.
        </p>
      </Card>
    );
  }

  const { correlationMatrix, mappings } = analysisResults;

  // Convert correlation matrix to scatter plot data
  const scatterData = Object.entries(correlationMatrix).flatMap(([variable1, correlations]) =>
    Object.entries(correlations).map(([variable2, correlation]) => ({
      x: variable1,
      y: variable2,
      correlation: Number(correlation.toFixed(2)),
      size: Math.abs(correlation) * 100
    }))
  );

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Correlation Analysis</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis dataKey="x" />
                <YAxis dataKey="y" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background p-2 rounded-lg border shadow-lg">
                          <p className="font-medium">{`${data.x} vs ${data.y}`}</p>
                          <p className="text-sm text-muted-foreground">
                            Correlation: {data.correlation}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={scatterData}
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {Object.keys(mappings).length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Variable Mappings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(mappings).map(([column, mapping]) => (
                <div key={column} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <h4 className="font-medium mb-2">{column}</h4>
                  <div className="space-y-1">
                    {Object.entries(mapping).map(([text, value]) => (
                      <div key={text} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{text}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIResults;