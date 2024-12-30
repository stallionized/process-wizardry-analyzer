import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Project {
  id: string;
  projectName: string;
  clientName: string;
  deadline: Date;
  status: string;
}

const Landing = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const handleCreateProject = () => {
    const newProject = {
      id: Math.random().toString(36).substr(2, 9),
      projectName: '',
      clientName: '',
      deadline: new Date(),
      status: 'Not Started'
    };
    setProjects([...projects, newProject]);
    navigate(`/project/${newProject.id}`);
  };

  const handleStatusChange = (projectId: string, newStatus: string) => {
    if (newStatus === 'Delete') {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setDeleteProject(project);
      }
      return;
    }

    setProjects(projects.map(project => 
      project.id === projectId ? { ...project, status: newStatus } : project
    ));
    toast.success(`Project status updated to ${newStatus}`);
  };

  const handleDeleteConfirm = () => {
    if (deleteProject) {
      // In a real app, you would also move the project to the recycle bin here
      setProjects(projects.filter(p => p.id !== deleteProject.id));
      setDeleteProject(null);
      toast.success('Project moved to recycle bin');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
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
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No projects yet. Click "New Project" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
                    <h3 className="font-medium truncate">{project.projectName || 'Untitled Project'}</h3>
                    <div className="text-sm text-muted-foreground">
                      <span>{project.clientName || 'No client'}</span>
                      <span className="mx-2">•</span>
                      <span>Due {format(project.deadline, 'PP')}</span>
                    </div>
                  </div>
                  <Select
                    value={project.status}
                    onValueChange={(value) => handleStatusChange(project.id, value)}
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
      </Card>

      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the project and all its associated files and analysis to the recycle bin.
              You can restore it from there if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Move to Recycle Bin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Landing;