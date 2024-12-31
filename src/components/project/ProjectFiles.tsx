import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FileUploadTab from './FileUploadTab';

interface ProjectFilesProps {
  projectId: string;
}

const ProjectFiles = ({ projectId }: ProjectFilesProps) => {
  const queryClient = useQueryClient();

  const { data: files = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ['files', projectId],
    queryFn: async () => {
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null);

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
            isNew: file.created_at === null,
          };
        })
      );

      return filesWithUrls;
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ files, type }: { files: File[], type: string }) => {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const filePath = `${projectId}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase
            .from('files')
            .insert({
              project_id: projectId,
              name: file.name,
              type,
              storage_path: filePath,
              created_at: null, // This will mark the file as new
            });

          if (dbError) throw dbError;

          return file.name;
        })
      );

      return uploadedFiles;
    },
    onSuccess: (uploadedFiles) => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
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
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      toast.success('File deleted successfully');
    },
  });

  const submitFilesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('files')
        .update({ created_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .is('created_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    },
  });

  if (isLoadingFiles) {
    return <div>Loading files...</div>;
  }

  return (
    <FileUploadTab
      files={files}
      onUpload={(files, type) => uploadFileMutation.mutate({ files, type })}
      onDelete={(fileId) => deleteFileMutation.mutate(fileId)}
      onSubmit={() => submitFilesMutation.mutate()}
    />
  );
};

export default ProjectFiles;