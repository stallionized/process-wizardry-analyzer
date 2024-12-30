import React from 'react';
import { Card } from '@/components/ui/card';
import { Folder } from 'lucide-react';

const Client = () => {
  // In a real application, this would be fetched from an API
  const sharedProjects = []; // This would be populated with actual shared projects

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
        <p className="text-muted-foreground">
          View shared process engineering analyses
        </p>
      </div>

      {sharedProjects.length > 0 ? (
        <div className="grid gap-4">
          {sharedProjects.map((project) => (
            <Card key={project.id} className="p-6">
              <div className="flex items-center space-x-3">
                <Folder className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Shared on {new Date(project.sharedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-muted-foreground">
            No projects have been shared with you yet.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Client;