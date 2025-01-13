import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, ChartBar, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProjectDetails from '@/components/project/ProjectDetails';
import ProjectFiles from '@/components/project/ProjectFiles';
import AIResults from '@/components/project/AIResults';
import ControlResults from '@/components/project/ControlResults';
import TrendsAndThemes from '@/components/project/TrendsAndThemes';
import ExternalComplaints from '@/components/project/ExternalComplaints';
import { useProjectManagement } from '@/hooks/useProjectManagement';

const ProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [currentTabSet, setCurrentTabSet] = useState(0);
  
  if (!id) return <div>Project ID is required</div>;

  const { project, isLoadingProject, updateProjectMutation } = useProjectManagement(id);

  if (isLoadingProject) {
    return <div>Loading project details...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const allTabs = [
    {
      value: "project",
      label: "Project Details",
      icon: <Grid className="mr-2 h-4 w-4" />,
      content: (
        <ProjectDetails
          projectName={project.project_name}
          setProjectName={(name) => updateProjectMutation.mutate({ project_name: name })}
          clientName={project.client_name || ''}
          setClientName={(name) => updateProjectMutation.mutate({ client_name: name })}
          deadline={project.deadline ? new Date(project.deadline) : undefined}
          setDeadline={(date) => updateProjectMutation.mutate({ deadline: date?.toISOString() })}
        />
      )
    },
    {
      value: "upload",
      label: "File Upload",
      icon: <Grid className="mr-2 h-4 w-4" />,
      content: <ProjectFiles projectId={id} />
    },
    {
      value: "results",
      label: "AI Results",
      icon: <Grid className="mr-2 h-4 w-4" />,
      content: <AIResults projectId={id} />
    },
    {
      value: "control",
      label: "Control Results",
      icon: <ChartBar className="mr-2 h-4 w-4" />,
      content: <ControlResults projectId={id} />
    },
    {
      value: "trends",
      label: "Trends & Themes",
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
      content: <TrendsAndThemes projectId={id} />
    },
    {
      value: "complaints",
      label: "External Complaints",
      icon: <AlertTriangle className="mr-2 h-4 w-4" />,
      content: <ExternalComplaints projectId={id} />
    }
  ];

  const tabsPerSet = 4;
  const totalSets = Math.ceil(allTabs.length / tabsPerSet);
  const currentTabs = allTabs.slice(
    currentTabSet * tabsPerSet,
    (currentTabSet + 1) * tabsPerSet
  );

  const handlePreviousSet = () => {
    setCurrentTabSet(prev => Math.max(0, prev - 1));
  };

  const handleNextSet = () => {
    setCurrentTabSet(prev => Math.min(totalSets - 1, prev + 1));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Process Engineering Analysis</h1>
        <p className="text-muted-foreground">
          Manage your process engineering project and documentation
        </p>
      </div>

      <Tabs defaultValue="project" className="w-full">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousSet}
            disabled={currentTabSet === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <TabsList className="grid flex-1" style={{ gridTemplateColumns: `repeat(${currentTabs.length}, 1fr)` }}>
            {currentTabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextSet}
            disabled={currentTabSet === totalSets - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {allTabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;