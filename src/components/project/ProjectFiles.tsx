import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FileUploadTab from './FileUploadTab';
import { sendFilesToWebhook } from '@/services/webhookService';

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

      if (error) {
        console.error('Files fetch error:', error);
        throw error;
      }

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

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
          }

          const { error: dbError } = await supabase
            .from('files')
            .insert({
              project_id: projectId,
              name: file.name,
              type,
              storage_path: filePath,
              created_at: null, // This will mark the file as new
            });

          if (dbError) {
            console.error('Database insert error:', dbError);
            throw dbError;
          }

          return file.name;
        })
      );

      return uploadedFiles;
    },
    onSuccess: (uploadedFiles) => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    },
    onError: (error) => {
      console.error('Upload mutation error:', error);
      toast.error('Failed to upload file(s)');
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
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast.error('Failed to delete file');
    },
  });

  const submitFilesMutation = useMutation({
    mutationFn: async () => {
      // Get all new dataset files
      const newDatasetFiles = files.filter(file => file.isNew && file.type === 'dataset');
      console.log('New dataset files to process:', newDatasetFiles);
      
      if (newDatasetFiles.length === 0) {
        console.log('No new dataset files to process');
        return;
      }

      // Try to send new dataset files to webhook for analysis
      const webhookSuccess = await sendFilesToWebhook(projectId, newDatasetFiles);
      console.log('Webhook processing result:', webhookSuccess);

      if (!webhookSuccess) {
        console.warn('Webhook processing failed');
        toast.warning('Files submitted. Analysis may be delayed.');
      } else {
        toast.success('Files submitted for analysis');
      }

      // Update all new files to mark them as no longer new
      const { error } = await supabase
        .from('files')
        .update({ created_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .is('created_at', null);

      if (error) {
        console.error('Error updating file status:', error);
        throw error;
      }

      // Invalidate both files and analysis queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      queryClient.invalidateQueries({ queryKey: ['analysis', projectId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    },
    onError: (error) => {
      console.error('Submit mutation error:', error);
      toast.error('Failed to submit files');
    },
  });

  return (
    <FileUploadTab
      files={files}
      onUpload={(files, type) => uploadFileMutation.mutate({ files, type })}
      onDelete={(fileId) => deleteFileMutation.mutate(fileId)}
      onSubmit={() => submitFilesMutation.mutate()}
      isLoading={isLoadingFiles}
      isSubmitting={submitFilesMutation.isPending}
    />
  );
};

export default ProjectFiles;