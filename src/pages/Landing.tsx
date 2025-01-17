import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import ProjectList from '@/components/projects/ProjectList';
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog';
import { useProjects } from '@/hooks/useProjects';

type ProjectStatus = Database['public']['Enums']['project_status'];

interface Project {
  id: string;
  project_name: string;
  client_name: string | null;
  deadline: string | null;
  status: ProjectStatus;
}

const Landing = () => {
  const navigate = useNavigate();
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const { projects, isLoading, createProjectMutation, updateProjectMutation, softDeleteMutation } = useProjects();

  const handleCreateProject = () => {
    createProjectMutation.mutate(undefined, {
      onSuccess: (data) => {
        navigate(`/project/${data.id}`);
      },
    });
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus | 'Delete') => {
    if (newStatus === 'Delete') {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setDeleteProject(project);
      }
      return;
    }

    updateProjectMutation.mutate({ id: projectId, status: newStatus });
  };

  const handleDeleteConfirm = () => {
    if (deleteProject) {
      softDeleteMutation.mutate(deleteProject.id);
      setDeleteProject(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pt-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your process engineering projects
          </p>
        </div>
        <Button onClick={handleCreateProject}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <Card className="p-6">
        <div className="max-h-[600px] overflow-y-auto">
          <ProjectList
            projects={projects}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
          />
        </div>
      </Card>

      <DeleteProjectDialog
        isOpen={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Landing;