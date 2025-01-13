import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export const useProjectManagement = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updates: Partial<typeof project>) => {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
      
      if (error) throw error;

      // Trigger complaints analysis if client name or topics changed
      if (updates.client_name || updates.topics) {
        await analyzeComplaints(projectId, updates.client_name || project?.client_name, updates.topics || project?.topics);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Project updated successfully');
    },
  });

  const analyzeComplaints = async (projectId: string, clientName?: string, topics?: string) => {
    if (!clientName) {
      console.log('No client name provided, skipping analysis');
      return;
    }

    try {
      const response = await supabase.functions.invoke('analyze-complaints', {
        body: { projectId, clientName, topics }
      });

      if (response.error) {
        throw response.error;
      }

      queryClient.invalidateQueries({ queryKey: ['complaints', projectId] });
      toast.success('Complaints analysis completed');
    } catch (error) {
      console.error('Error analyzing complaints:', error);
      toast.error('Failed to analyze complaints');
    }
  };

  return {
    project,
    isLoadingProject,
    updateProjectMutation,
  };
};