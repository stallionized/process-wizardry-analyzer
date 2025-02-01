import React from 'react';
import { useProjects } from '@/hooks/useProjects';
import ProjectList from '@/components/projects/ProjectList';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';

const ProjectDashboard = () => {
  const { projects, isLoading: isLoadingProjects, updateProjectMutation, softDeleteMutation } = useProjects();

  const handleStatusChange = async (projectId: string, newStatus: any) => {
    if (newStatus === 'Delete') {
      await softDeleteMutation.mutateAsync(projectId);
    } else {
      await updateProjectMutation.mutateAsync({ id: projectId, status: newStatus });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects Dashboard</h1>
        <CreateProjectDialog clientId="" />
      </div>
      <ProjectList 
        projects={projects} 
        isLoading={isLoadingProjects}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default ProjectDashboard;