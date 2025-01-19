import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Grid, ChartBar, TrendingUp, AlertTriangle, FileText, Database } from 'lucide-react';
import ProjectDetails from '@/components/project/ProjectDetails';
import ProjectFiles from '@/components/project/ProjectFiles';
import AIResults from '@/components/project/AIResults';
import ControlResults from '@/components/project/ControlResults';
import TrendsAndThemes from '@/components/project/TrendsAndThemes';
import ExternalComplaints from '@/components/project/ExternalComplaints';
import { useProjectManagement } from '@/hooks/useProjectManagement';

const ProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('project');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  if (!id) return <div>Project ID is required</div>;

  const { project, isLoadingProject, updateProjectMutation } = useProjectManagement(id);

  if (isLoadingProject) {
    return <div>Loading project details...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const handleProjectNameUpdate = (newName: string) => {
    updateProjectMutation.mutate({ project_name: newName });
  };

  const handleClientNameUpdate = (newName: string) => {
    updateProjectMutation.mutate({ client_name: newName });
  };

  const handleDeadlineUpdate = (newDate: Date | undefined) => {
    if (newDate) {
      updateProjectMutation.mutate({ deadline: newDate.toISOString() });
    } else {
      updateProjectMutation.mutate({ deadline: null });
    }
  };

  const handleTopicsUpdate = (newTopics: string) => {
    updateProjectMutation.mutate({ topics: newTopics });
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
      label: 'External Complaints',
      icon: <AlertTriangle className="h-5 w-5" />,
      component: <ExternalComplaints projectId={id} />
    }
  ];

  const activeComponent = menuItems.find(item => item.id === activeTab)?.component;

  return (
    <div className="animate-fade-in">
      <div className="min-h-screen relative">
        {/* Vertical Menu */}
        <div 
          className="fixed left-12 top-28 h-[calc(100vh-7rem)] z-40"
          onMouseEnter={() => setIsMenuVisible(true)}
          onMouseLeave={() => setIsMenuVisible(false)}
        >
          <div 
            className={cn(
              "flex flex-col gap-2 p-4 h-full bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out",
              isMenuVisible ? "w-64 border-r border-black" : "w-16"
            )}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-accent/10 hover:text-accent min-w-[2rem]",
                  activeTab === item.id ? "bg-accent/10 text-accent" : "text-foreground",
                  !isMenuVisible && "justify-center px-2"
                )}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                <span 
                  className={cn(
                    "font-medium whitespace-nowrap transition-opacity duration-300",
                    isMenuVisible ? "opacity-100" : "opacity-0 w-0"
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className={cn(
          "transition-all duration-300 ease-in-out pt-6 w-[calc(100%-4rem)]",
          isMenuVisible ? "ml-64" : "ml-16"
        )}>
          <div className="animate-fade-in p-4 w-full">
            {activeComponent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
