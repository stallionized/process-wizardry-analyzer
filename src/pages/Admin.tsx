import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Folder } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  sharedWith: string[];
}

const Admin = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedClientEmail, setSelectedClientEmail] = useState('');

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProjectName,
      createdAt: new Date(),
      sharedWith: []
    };

    setProjects(prev => [...prev, newProject]);
    setNewProjectName('');
    toast.success('Project created successfully');
  };

  const handleShareProject = (projectId: string) => {
    if (!selectedClientEmail.trim()) {
      toast.error('Please enter a client email');
      return;
    }

    setProjects(prev => prev.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          sharedWith: [...project.sharedWith, selectedClientEmail]
        };
      }
      return project;
    }));

    setSelectedClientEmail('');
    toast.success('Project shared successfully');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and review process engineering analyses
        </p>
      </div>

      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Enter a name for your new project.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="my-4"
            />
            <DialogFooter>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Folder className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created {project.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Share with Client</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Project</DialogTitle>
                    <DialogDescription>
                      Enter the client's email address to share this project.
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    value={selectedClientEmail}
                    onChange={(e) => setSelectedClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    type="email"
                    className="my-4"
                  />
                  <DialogFooter>
                    <Button onClick={() => handleShareProject(project.id)}>
                      Share Project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {project.sharedWith.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium">Shared with:</p>
                <ul className="mt-2 space-y-1">
                  {project.sharedWith.map((email, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {email}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Admin;