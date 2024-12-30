import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/FileUpload';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

interface UploadedFile extends File {
  type: string;
}

const Index = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleUpload = (uploadedFiles: File[], fileType: string) => {
    const filesWithType = uploadedFiles.map(file => ({
      ...file,
      type: fileType,
    })) as UploadedFile[];
    
    setFiles(prev => [...prev, ...filesWithType]);
    toast.success(`${uploadedFiles.length} files uploaded successfully`);
  };

  const handleAnalyze = () => {
    toast.info('Analysis started! This feature will be implemented in the next iteration.');
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
        
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Uploaded Files:</h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB) - {file.type}
                </li>
              ))}
            </ul>
            
            <Button 
              className="mt-4"
              onClick={handleAnalyze}
              disabled={files.length === 0}
            >
              Start Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Index;