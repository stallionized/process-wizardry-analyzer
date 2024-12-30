import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ProjectDetails from '@/components/project/ProjectDetails';
import FileUploadTab from '@/components/project/FileUploadTab';
import AIResults from '@/components/project/AIResults';

interface Project {
  id: string;
  project_name: string;
  client_name: string | null;
  deadline: string | null;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

const ProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: files = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ['files', id],
    queryFn: async () => {
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', id);

      if (error) throw error;

      const filesWithUrls = await Promise.all(
        files.map(async (file) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('project-files')
            .getPublicUrl(file.storage_path);

          return {
            id: file.id,
            name: file.name,
            type: file.type,
            url: publicUrl,
          };
        })
      );

      return filesWithUrls;
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updates: Partial<Project>) => {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Project details updated successfully');
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ files, type }: { files: File[], type: string }) => {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const filePath = `${id}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase
            .from('files')
            .insert({
              project_id: id,
              name: file.name,
              type,
              storage_path: filePath,
            });

          if (dbError) throw dbError;

          return file.name;
        })
      );

      return uploadedFiles;
    },
    onSuccess: (uploadedFiles) => {
      queryClient.invalidateQueries({ queryKey: ['files', id] });
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', fileId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', id] });
      toast.success('File deleted successfully');
    },
  });

  if (isLoadingProject) {
    return <div>Loading project details...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

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
            projectName={project.project_name}
            setProjectName={(name) => updateProjectMutation.mutate({ project_name: name })}
            clientName={project.client_name || ''}
            setClientName={(name) => updateProjectMutation.mutate({ client_name: name })}
            deadline={project.deadline ? new Date(project.deadline) : undefined}
            setDeadline={(date) => updateProjectMutation.mutate({ deadline: date?.toISOString() })}
          />
        </TabsContent>

        <TabsContent value="upload">
          <FileUploadTab
            files={files}
            onUpload={(files, type) => uploadFileMutation.mutate({ files, type })}
            onDelete={(fileId) => deleteFileMutation.mutate(fileId)}
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