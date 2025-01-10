import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrendsAndThemesProps {
  projectId: string;
}

const TrendsAndThemes = ({ projectId }: TrendsAndThemesProps) => {
  const { data: trendsAnalysis, isLoading, error } = useQuery({
    queryKey: ['trends', projectId],
    queryFn: async () => {
      console.log('Fetching trends analysis for project:', projectId);
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null);

      if (!files?.length) {
        console.log('No files found for trends analysis');
        return null;
      }

      const response = await supabase.functions.invoke('analyze-trends', {
        body: { projectId, files }
      });

      if (response.error) {
        console.error('Error analyzing trends:', response.error);
        throw response.error;
      }

      return response.data;
    },
    refetchInterval: (data) => (!data ? 5000 : false),
    retry: 3,
    meta: {
      onError: (error: Error) => {
        console.error('Error in trends analysis:', error);
        toast.error('Failed to analyze trends. Please try again later.');
      }
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Trends & Themes Analysis</h2>
        <p className="text-red-500">
          Failed to load trends analysis. Please try again later.
        </p>
      </Card>
    );
  }

  if (!trendsAnalysis) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Trends & Themes Analysis</h2>
        <p className="text-muted-foreground">
          Analysis will appear here after processing your dataset.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Trends & Themes Analysis</h2>
      <div className="prose prose-gray max-w-none">
        <div className="bg-muted/30 p-6 rounded-lg">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {trendsAnalysis.summary}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TrendsAndThemes;