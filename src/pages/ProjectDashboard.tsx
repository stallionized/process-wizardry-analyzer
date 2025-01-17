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
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isMenuVisible ? "ml-64" : "ml-16"
      )}>
        <div className="animate-fade-in">
          {activeComponent}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
