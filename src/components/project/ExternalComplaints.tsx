import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExternalComplaintsProps {
  projectId: string;
}

const ExternalComplaints = ({ projectId }: ExternalComplaintsProps) => {
  const { data: complaints, isLoading, error } = useQuery({
    queryKey: ['complaints', projectId],
    queryFn: async () => {
      console.log('Fetching external complaints for project:', projectId);
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null);

      if (!files?.length) {
        console.log('No files found for complaints analysis');
        return null;
      }

      const response = await supabase.functions.invoke('analyze-trends', {
        body: { projectId, files, type: 'complaints' }
      });

      if (response.error) {
        console.error('Error analyzing complaints:', response.error);
        throw response.error;
      }

      return response.data;
    },
    refetchInterval: (data) => (!data ? 5000 : false),
    retry: 3,
    meta: {
      onError: (error: Error) => {
        console.error('Error in complaints analysis:', error);
        toast.error('Failed to analyze complaints. Please try again later.');
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
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-red-500">
          Failed to load complaints analysis. Please try again later.
        </p>
      </Card>
    );
  }

  if (!complaints) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-muted-foreground">
          Analysis will appear here after processing your dataset.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
      <div className="prose prose-gray max-w-none">
        <div className="bg-muted/30 p-6 rounded-lg">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {complaints.summary}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ExternalComplaints;