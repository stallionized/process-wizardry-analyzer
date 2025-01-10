import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ControlResultsProps {
  projectId: string;
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
      return data.control_charts;
    },
    refetchInterval: (data) => (!data ? 5000 : false),
  });

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

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">Control Chart Results</h2>
      <div className="space-y-8">
        {/* Display control chart results here */}
        <pre className="bg-muted p-4 rounded-lg overflow-auto">
          {JSON.stringify(analysisResults, null, 2)}
        </pre>
      </div>
    </Card>
  );
};

export default ControlResults;