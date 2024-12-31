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
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AIResultsProps {
  projectId: string;
}

const AIResults = ({ projectId }: AIResultsProps) => {
  const { data: analysisResults, isLoading, error } = useQuery({
    queryKey: ['analysis', projectId],
    queryFn: async () => {
      console.log('Fetching analysis results for project:', projectId);
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching analysis results:', error);
        throw error;
      }
      
      if (!data) {
        console.log('No analysis results found');
        return null;
      }
      
      console.log('Analysis results found:', data);
      
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
    // Refresh every 5 seconds while loading to check for new results
    refetchInterval: (data) => (!data ? 5000 : false),
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

  // Get unique variables from the correlation matrix
  const variables = Object.keys(correlationMatrix);

  // Check if correlation matrix is empty
  const isCorrelationMatrixEmpty = variables.length === 0;

  if (isCorrelationMatrixEmpty) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-muted-foreground">
          No correlation data available. Please ensure your uploaded files contain numerical data for analysis.
        </p>
      </Card>
    );
  }

  // Convert correlation matrix to scatter plot data
  const scatterData = Object.entries(correlationMatrix).flatMap(([variable1, correlations]) =>
    Object.entries(correlations).map(([variable2, correlation]) => ({
      x: variable1,
      y: variable2,
      correlation: Number(correlation.toFixed(2)),
      size: Math.abs(correlation) * 100
    }))
  );

  // Function to get color based on correlation value
  const getCorrelationColor = (value: number) => {
    if (value === 1) return '#4CAF50';  // Perfect positive correlation
    if (value > 0.7) return '#81C784';  // Strong positive correlation
    if (value > 0.3) return '#A5D6A7';  // Moderate positive correlation
    if (value > -0.3) return '#FFFFFF'; // Weak or no correlation
    if (value > -0.7) return '#EF9A9A'; // Moderate negative correlation
    if (value >= -1) return '#E57373';  // Strong negative correlation
    return '#F44336';                   // Perfect negative correlation
  };

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Correlation Matrix</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variables</TableHead>
                  {variables.map((variable) => (
                    <TableHead key={variable}>{variable}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.map((variable1) => (
                  <TableRow key={variable1}>
                    <TableCell className="font-medium">{variable1}</TableCell>
                    {variables.map((variable2) => {
                      const correlation = correlationMatrix[variable1]?.[variable2] || 0;
                      return (
                        <TableCell 
                          key={`${variable1}-${variable2}`}
                          style={{
                            backgroundColor: getCorrelationColor(correlation),
                            transition: 'background-color 0.2s'
                          }}
                        >
                          {correlation.toFixed(2)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Correlation Visualization</h3>
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
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={getCorrelationColor(entry.correlation)}
                    />
                  ))}
                </Scatter>
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