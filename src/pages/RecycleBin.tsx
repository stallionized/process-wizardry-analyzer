import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Project {
  id: string;
  project_name: string;
  client_name: string | null;
  deleted_at: string;
}

const RecycleBin = () => {
  const queryClient = useQueryClient();

  const { data: deletedProjects = [], isLoading } = useQuery({
    queryKey: ['deleted-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const restoreProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: null })
        .eq('id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-projects'] });
      toast.success('Project restored successfully');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Recycle Bin</h1>
          <p className="text-muted-foreground">Loading deleted projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Recycle Bin</h1>
        <p className="text-muted-foreground">
          Deleted projects can be restored or permanently removed from here
        </p>
      </div>

      <Card className="p-6">
        {deletedProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No deleted projects yet.
          </div>
        ) : (
          <div className="space-y-4">
            {deletedProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{project.project_name}</h3>
                  <div className="text-sm text-muted-foreground">
                    <span>{project.client_name || 'No client'}</span>
                    <span className="mx-2">•</span>
                    <span>Deleted on {format(new Date(project.deleted_at), 'PP')}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => restoreProjectMutation.mutate(project.id)}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecycleBin;