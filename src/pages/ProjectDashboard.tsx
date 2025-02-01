import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Grid, ChartBar, TrendingUp, AlertTriangle, FileText, Database, Menu } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import ProjectList from '@/components/projects/ProjectList';
import ProjectDetails from '@/components/project/ProjectDetails';
import ProjectFiles from '@/components/project/ProjectFiles';
import AIResults from '@/components/project/AIResults';
import ControlResults from '@/components/project/ControlResults';
import TrendsAndThemes from '@/components/project/TrendsAndThemes';
import ExternalComplaints from '@/components/project/ExternalComplaints';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useSessionContext } from '@supabase/auth-helpers-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';

const ProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('project');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const isMobile = useIsMobile();
  const { projects, updateProjectMutation: listUpdateMutation, softDeleteMutation } = useProjects();
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
    }
  }, [session, navigate]);
  
  // If no ID is provided, show the projects list
  if (!id) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Projects Dashboard</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            New Project
          </Button>
        </div>
        <ProjectList 
          projects={projects || []} 
          isLoading={false}
          onStatusChange={(projectId, newStatus) => {
            if (newStatus === 'Delete') {
              softDeleteMutation.mutate(projectId);
            } else {
              listUpdateMutation.mutate({ id: projectId, status: newStatus });
            }
          }}
        />
        <CreateProjectDialog 
          clientId={session?.user?.id || ''}
          isOpen={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    );
  }

  const { project, updateProjectMutation } = useProjectManagement(id);

  if (!project) {
    return null;
  }

  const handleProjectNameUpdate = (newName: string) => {
    updateProjectMutation.mutate({ id, project_name: newName });
  };

  const handleClientNameUpdate = (newName: string) => {
    updateProjectMutation.mutate({ id, client_name: newName });
  };

  const handleDeadlineUpdate = (newDate: Date | undefined) => {
    if (newDate) {
      updateProjectMutation.mutate({ id, deadline: newDate.toISOString() });
    } else {
      updateProjectMutation.mutate({ id, deadline: null });
    }
  };

  const handleTopicsUpdate = (newTopics: string) => {
    updateProjectMutation.mutate({ id, topics: newTopics });
  };

  const menuItems = [
    {
      id: 'project',
      label: 'Project Details',
      icon: <FileText className="h-5 w-5" />,
      component: (
        <ProjectDetails
          projectName={project.project_name}
          setProjectName={handleProjectNameUpdate}
          clientName={project.client_name || ''}
          setClientName={handleClientNameUpdate}
          deadline={project.deadline ? new Date(project.deadline) : undefined}
          setDeadline={handleDeadlineUpdate}
          topics={project.topics || ''}
          setTopics={handleTopicsUpdate}
        />
      )
    },
    {
      id: 'upload',
      label: 'File Upload',
      icon: <Database className="h-5 w-5" />,
      component: <ProjectFiles projectId={id} />
    },
    {
      id: 'results',
      label: 'AI Results',
      icon: <Grid className="h-5 w-5" />,
      component: <AIResults projectId={id} />
    },
    {
      id: 'control',
      label: 'Control Results',
      icon: <ChartBar className="h-5 w-5" />,
      component: <ControlResults projectId={id} />
    },
    {
      id: 'trends',
      label: 'Trends & Themes',
      icon: <TrendingUp className="h-5 w-5" />,
      component: <TrendsAndThemes projectId={id} />
    },
    {
      id: 'complaints',
      label: 'External Reviews',
      icon: <AlertTriangle className="h-5 w-5" />,
      component: <ExternalComplaints projectId={id} />
    }
  ];

  const activeComponent = menuItems.find(item => item.id === activeTab)?.component;

  const MenuContent = () => (
    <div className="flex flex-col gap-2">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id);
            if (isMobile) setIsMenuVisible(false);
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full",
            activeTab === item.id 
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
          )}
        >
          <div className="flex-shrink-0">
            {item.icon}
          </div>
          <span className={cn(
            "font-medium transition-opacity duration-200",
            !isMenuVisible && !isMobile ? "opacity-0 w-0" : "opacity-100"
          )}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="min-h-screen relative flex">
        {isMobile ? (
          <div className="fixed top-20 left-4 z-40">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                <MenuContent />
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div 
            className={cn(
              "sticky top-20 h-[calc(100vh-5rem)] transition-all duration-300 ease-in-out",
              isMenuVisible ? "w-64" : "w-16"
            )}
            onMouseEnter={() => setIsMenuVisible(true)}
            onMouseLeave={() => setIsMenuVisible(false)}
          >
            <div className={cn(
              "h-full py-4 px-2 bg-background/95 backdrop-blur-sm border-r",
              isMenuVisible ? "w-64" : "w-16"
            )}>
              <MenuContent />
            </div>
          </div>
        )}

        <div className={cn(
          "flex-1 transition-all duration-300 ease-in-out p-6",
          isMobile && "pt-20"
        )}>
          <div className="max-w-[1200px] mx-auto">
            {activeComponent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
