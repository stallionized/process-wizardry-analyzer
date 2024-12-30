import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/FileUpload';
import { toast } from 'sonner';
import { Trash2, File } from 'lucide-react';
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
}

const Index = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

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
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Process Engineering Analysis</h1>
        <p className="text-muted-foreground">
          Upload your process engineering data and documentation for AI-powered analysis
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
        <FileUpload onUpload={handleUpload} />
      </Card>

      {files.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
    </div>
  );
};

export default Index;