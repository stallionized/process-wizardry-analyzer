import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Project updated successfully');
    },
  });

  return {
    project,
    isLoadingProject,
    updateProjectMutation,
  };
};