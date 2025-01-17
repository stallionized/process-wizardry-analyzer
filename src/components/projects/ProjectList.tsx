import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Trash2, Search } from 'lucide-react';

type ProjectStatus = Database['public']['Enums']['project_status'];

interface Project {
  id: string;
  project_name: string;
  client_name: string | null;
  deadline: string | null;
  status: ProjectStatus;
  program_id: string | null;
  programs?: {
    program_name: string;
  };
}

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  onStatusChange: (projectId: string, newStatus: ProjectStatus | 'Delete') => void;
}

const ProjectList = ({ projects, isLoading, onStatusChange }: ProjectListProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: ProjectStatus | 'All') => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No projects match your search criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
                <h3 className="font-medium truncate">{project.project_name || 'Untitled Project'}</h3>
                <div className="text-sm text-muted-foreground">
                  <span>{project.client_name || 'No client'}</span>
                  {project.programs?.program_name && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{project.programs.program_name}</span>
                    </>
                  )}
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
      )}
    </div>
  );
};

export default ProjectList;