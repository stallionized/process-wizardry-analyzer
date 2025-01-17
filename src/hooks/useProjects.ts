import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useSessionContext } from '@supabase/auth-helpers-react';

type ProjectStatus = Database['public']['Enums']['project_status'];
type CreateProjectInput = {
  project_name: string;
  program_id?: string;
  client_id?: string;
};

export const useProjects = () => {
  const queryClient = useQueryClient();
  const { session } = useSessionContext();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects with session:', session?.user.id);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          programs (
            program_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!session, // Only run query if user is authenticated
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProjectStatus }) => {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project moved to recycle bin');
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...input,
          status: 'Not Started' as ProjectStatus,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
  });

  return {
    projects,
    isLoading,
    error,
    updateProjectMutation,
    softDeleteMutation,
    createProjectMutation,
  };
};