import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProjectList from '@/components/projects/ProjectList';
import { useProjects } from '@/hooks/useProjects';
import { Database } from '@/integrations/supabase/types';

type ProjectStatus = Database['public']['Enums']['project_status'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, isLoading, updateProjectMutation, softDeleteMutation } = useProjects();

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus | 'Delete') => {
    if (newStatus === 'Delete') {
      await softDeleteMutation.mutateAsync(projectId);
    } else {
      await updateProjectMutation.mutateAsync({ id: projectId, status: newStatus });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Process Engineering Analysis</h1>
          <p className="text-muted-foreground">
            Manage your process engineering project and documentation
          </p>
        </div>
        <Button onClick={() => navigate('/project/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default Dashboard;