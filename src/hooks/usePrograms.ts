import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Program, CreateProgramInput, UpdateProgramInput } from '@/types/program';
import { toast } from 'sonner';

export const usePrograms = (clientId?: string) => {
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs', clientId],
    queryFn: async () => {
      let query = supabase
        .from('programs')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Program[];
    },
    enabled: !clientId || !!clientId,
  });

  const createProgramMutation = useMutation({
    mutationFn: async (newProgram: CreateProgramInput) => {
      const { data, error } = await supabase
        .from('programs')
        .insert(newProgram)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program created successfully');
    },
    onError: (error) => {
      console.error('Error creating program:', error);
      toast.error('Failed to create program');
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateProgramInput) => {
      const { error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program updated successfully');
    },
    onError: (error) => {
      console.error('Error updating program:', error);
      toast.error('Failed to update program');
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('programs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program moved to recycle bin');
    },
    onError: (error) => {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete program');
    },
  });

  return {
    programs,
    isLoading,
    createProgramMutation,
    updateProgramMutation,
    deleteProgramMutation,
  };
};