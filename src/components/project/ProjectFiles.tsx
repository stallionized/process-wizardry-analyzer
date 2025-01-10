import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FileUploadTab from './FileUploadTab';
import { sendFilesToWebhook } from '@/services/webhookService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectFilesProps {
  projectId: string;
}

const ProjectFiles = ({ projectId }: ProjectFilesProps) => {
  const queryClient = useQueryClient();
  const [showIdentifierDialog, setShowIdentifierDialog] = React.useState(false);
  const [uniqueIdentifiers, setUniqueIdentifiers] = React.useState<string[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = React.useState<string>('');
  const [pendingFiles, setPendingFiles] = React.useState<any[]>([]);

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
              created_at: null,
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

  const checkUniqueIdentifiers = async (files: any[]) => {
    try {
      const response = await supabase.functions.invoke('analyze-dataset', {
        body: {
          projectId,
          files,
          checkOnly: true
        }
      });

      if (response.error) throw response.error;
      return response.data.uniqueIdentifiers;
    } catch (error) {
      console.error('Error checking unique identifiers:', error);
      throw error;
    }
  };

  const submitFilesMutation = useMutation({
    mutationFn: async () => {
      const newDatasetFiles = files.filter(file => file.isNew && file.type === 'dataset');
      
      if (newDatasetFiles.length === 0) {
        console.log('No new dataset files to process');
        return;
      }

      const webhookSuccess = await sendFilesToWebhook(projectId, newDatasetFiles);
      
      if (!webhookSuccess) {
        console.warn('Webhook processing failed');
        toast.warning('Files submitted. Analysis may be delayed.');
      } else {
        toast.success('Files submitted for analysis');
      }

      const { error } = await supabase
        .from('files')
        .update({ created_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .is('created_at', null);

      if (error) {
        console.error('Error updating file status:', error);
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      queryClient.invalidateQueries({ queryKey: ['analysis', projectId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      setShowIdentifierDialog(false);
      setPendingFiles([]);
      setSelectedIdentifier('');
    },
    onError: (error) => {
      console.error('Submit mutation error:', error);
      toast.error('Failed to submit files');
    },
  });

  const handleSubmit = async () => {
    const newDatasetFiles = files.filter(file => file.isNew && file.type === 'dataset');
    if (newDatasetFiles.length === 0) {
      toast.error('No new dataset files to process');
      return;
    }

    try {
      setPendingFiles(newDatasetFiles);
      const identifiers = await checkUniqueIdentifiers(newDatasetFiles);
      setUniqueIdentifiers(identifiers);
      
      if (identifiers.length > 0) {
        setShowIdentifierDialog(true);
      } else {
        // Show dialog asking if they want to proceed without unique identifiers
        setShowIdentifierDialog(true);
      }
    } catch (error) {
      console.error('Error checking unique identifiers:', error);
      toast.error('Failed to check unique identifiers');
    }
  };

  return (
    <>
      <FileUploadTab
        files={files}
        onUpload={(files, type) => uploadFileMutation.mutate({ files, type })}
        onDelete={(fileId) => deleteFileMutation.mutate(fileId)}
        onSubmit={handleSubmit}
        isLoading={isLoadingFiles}
        isSubmitting={submitFilesMutation.isPending}
      />

      <AlertDialog open={showIdentifierDialog} onOpenChange={setShowIdentifierDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {uniqueIdentifiers.length > 0 ? 'Select Unique Identifier' : 'No Unique Identifiers Found'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {uniqueIdentifiers.length > 0 ? (
                <div className="space-y-4">
                  <p>Please select a unique identifier for your dataset:</p>
                  <Select value={selectedIdentifier} onValueChange={setSelectedIdentifier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select identifier" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueIdentifiers.map((identifier) => (
                        <SelectItem key={identifier} value={identifier}>
                          {identifier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                'No unique identifiers were found in your dataset. Would you like to proceed anyway?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowIdentifierDialog(false);
              setPendingFiles([]);
              setSelectedIdentifier('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (uniqueIdentifiers.length > 0 && !selectedIdentifier) {
                  toast.error('Please select a unique identifier');
                  return;
                }
                submitFilesMutation.mutate();
              }}
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectFiles;