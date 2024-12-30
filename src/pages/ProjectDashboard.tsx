import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid } from 'lucide-react';
import ProjectDetails from '@/components/project/ProjectDetails';
import ProjectFiles from '@/components/project/ProjectFiles';
import AIResults from '@/components/project/AIResults';
import { useProjectManagement } from '@/hooks/useProjectManagement';

const ProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>Project ID is required</div>;

  const { project, isLoadingProject, updateProjectMutation } = useProjectManagement(id);

  if (isLoadingProject) {
    return <div>Loading project details...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Process Engineering Analysis</h1>
        <p className="text-muted-foreground">
          Manage your process engineering project and documentation
        </p>
      </div>

      <Tabs defaultValue="project" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="project" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Grid className="mr-2 h-4 w-4" />
            Project Details
          </TabsTrigger>
          <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Grid className="mr-2 h-4 w-4" />
            File Upload
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Grid className="mr-2 h-4 w-4" />
            AI Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="project">
          <ProjectDetails
            projectName={project.project_name}
            setProjectName={(name) => updateProjectMutation.mutate({ project_name: name })}
            clientName={project.client_name || ''}
            setClientName={(name) => updateProjectMutation.mutate({ client_name: name })}
            deadline={project.deadline ? new Date(project.deadline) : undefined}
            setDeadline={(date) => updateProjectMutation.mutate({ deadline: date?.toISOString() })}
          />
        </TabsContent>

        <TabsContent value="upload">
          <ProjectFiles projectId={id} />
        </TabsContent>

        <TabsContent value="results">
          <AIResults />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;