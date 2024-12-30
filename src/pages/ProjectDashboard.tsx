import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid } from 'lucide-react';
import ProjectDetails from '@/components/project/ProjectDetails';
import FileUploadTab from '@/components/project/FileUploadTab';
import AIResults from '@/components/project/AIResults';

const ProjectDashboard = () => {
  const [projectName, setProjectName] = React.useState('');
  const [clientName, setClientName] = React.useState('');
  const [deadline, setDeadline] = React.useState<Date>();

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
            projectName={projectName}
            setProjectName={setProjectName}
            clientName={clientName}
            setClientName={setClientName}
            deadline={deadline}
            setDeadline={setDeadline}
          />
        </TabsContent>

        <TabsContent value="upload">
          <FileUploadTab
            files={[]}
            onUpload={() => {}}
            onDelete={() => {}}
          />
        </TabsContent>

        <TabsContent value="results">
          <AIResults />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;