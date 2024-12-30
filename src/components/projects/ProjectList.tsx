import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

type ProjectStatus = Database['public']['Enums']['project_status'];

interface Project {
  id: string;
  project_name: string;
  client_name: string | null;
  deadline: string | null;
  status: ProjectStatus;
}

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  onStatusChange: (projectId: string, newStatus: ProjectStatus | 'Delete') => void;
}

const ProjectList = ({ projects, isLoading, onStatusChange }: ProjectListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading projects...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No projects yet. Click "New Project" to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
        >
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
            <h3 className="font-medium truncate">{project.project_name || 'Untitled Project'}</h3>
            <div className="text-sm text-muted-foreground">
              <span>{project.client_name || 'No client'}</span>
              <span className="mx-2">•</span>
              <span>Due {project.deadline ? format(new Date(project.deadline), 'PP') : 'No deadline'}</span>
            </div>
          </div>
          <Select
            value={project.status}
            onValueChange={(value: ProjectStatus | 'Delete') => onStatusChange(project.id, value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="Delete" className="text-destructive">
                <div className="flex items-center">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;