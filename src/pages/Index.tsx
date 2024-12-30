import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FileUpload from '@/components/FileUpload';
import { toast } from 'sonner';
import { Trash2, File, Grid } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

const Index = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [deadline, setDeadline] = useState<Date>();

  const handleUpload = (uploadedFiles: File[], fileType: string) => {
    const newFiles = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: fileType,
      url: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`${uploadedFiles.length} files uploaded successfully`);
  };

  const handleDelete = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success('File deleted successfully');
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

        <TabsContent value="project" className="mt-6 space-y-4 animate-fade-in">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>

              <div className="space-y-2">
                <Label>Project Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : "Select deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="mt-6 space-y-4 animate-fade-in">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
            <FileUpload onUpload={handleUpload} />
          </Card>

          {files.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-scale-in">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {file.name}
                        </a>
                        <p className="text-sm text-muted-foreground">Type: {file.type}</p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this file and all related results and analyses.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(file.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-6 animate-fade-in">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
            <p className="text-muted-foreground">
              Analysis results will appear here after processing your uploaded files.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;