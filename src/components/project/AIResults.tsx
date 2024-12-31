import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AIResultsProps {
  projectId: string;
}

const AIResults = ({ projectId }: AIResultsProps) => {
  const { data: analysisResults, isLoading } = useQuery({
    queryKey: ['analysis', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data?.results;
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-muted-foreground">Loading analysis results...</p>
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

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Pearson Correlation Matrix</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-border">
              <thead>
                <tr>
                  <th className="border border-border p-2 bg-muted"></th>
                  {Object.keys(correlationMatrix).map((column) => (
                    <th key={column} className="border border-border p-2 bg-muted">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(correlationMatrix).map(([row, correlations]) => (
                  <tr key={row}>
                    <th className="border border-border p-2 bg-muted">{row}</th>
                    {Object.entries(correlations as Record<string, number>).map(([col, value]) => (
                      <td
                        key={`${row}-${col}`}
                        className="border border-border p-2 text-center"
                        style={{
                          backgroundColor: value > 0 
                            ? `rgba(0, 255, 0, ${Math.abs(value)})`
                            : `rgba(255, 0, 0, ${Math.abs(value)})`,
                        }}
                      >
                        {value.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {Object.keys(mappings || {}).length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Column Mappings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(mappings).map(([column, mapping]) => (
                <div key={column} className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{column}</h4>
                  <div className="space-y-1">
                    {Object.entries(mapping as Record<string, number>).map(([text, value]) => (
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