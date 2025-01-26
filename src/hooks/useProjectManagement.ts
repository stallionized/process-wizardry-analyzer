import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useProjectManagement = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) {
        console.log('No project ID provided');
        return null;
      }

      console.log('Fetching project:', projectId);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }
      
      console.log('Fetched project data:', data);
      return data;
    },
    enabled: !!projectId, // Only run query if projectId exists
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updates: Partial<typeof project>) => {
      if (!projectId) {
        throw new Error('No project ID provided');
      }

      console.log('Updating project with:', updates);
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
      
      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error('Failed to update project');
    },
  });

  return {
    project,
    isLoadingProject,
    updateProjectMutation,
  };
};