import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import FileUpload from '@/components/FileUpload';
import { Trash2, File } from 'lucide-react';
import { toast } from 'sonner';
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

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  isNew?: boolean;
}

interface FileUploadTabProps {
  files: UploadedFile[];
  onUpload: (files: File[], fileType: string) => void;
  onDelete: (fileId: string) => void;
  onSubmit?: () => void;
}

const FileUploadTab = ({ files, onUpload, onDelete, onSubmit }: FileUploadTabProps) => {
  const handleUpload = (uploadedFiles: File[], fileType: string) => {
    onUpload(uploadedFiles, fileType);
  };

  const handleSubmit = () => {
    onSubmit?.();
    toast.success('Files submitted successfully');
  };

  const hasNewFiles = files.some(file => file.isNew);

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
        <FileUpload onUpload={handleUpload} />
      </Card>

      {files.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-scale-in">
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {file.name}
                        </a>
                        {file.isNew && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            New
                          </span>
                        )}
                      </div>
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
                          onClick={() => onDelete(file.id)}
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
          </ScrollArea>
          {hasNewFiles && (
            <div className="mt-4">
              <Button onClick={handleSubmit} className="w-full">
                Submit Files
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default FileUploadTab;