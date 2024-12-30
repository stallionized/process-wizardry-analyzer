import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FileUploadProps {
  onUpload: (files: File[], type: string) => void;
  className?: string;
}

const FILE_TYPES = [
  { value: 'dataset', label: 'Dataset' },
  { value: 'process-model', label: 'Process Model' },
  { value: 'procedures', label: 'Procedures' },
  { value: 'process-steps', label: 'Process Steps' },
];

const FileUpload = ({ onUpload, className }: FileUploadProps) => {
  const [selectedType, setSelectedType] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (selectedType) {
      onUpload(acceptedFiles, selectedType);
    } else {
      // Use toast to show error message
      toast.error('Please select a file type before uploading');
    }
  }, [onUpload, selectedType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  return (
    <div className="space-y-4">
      <Select value={selectedType} onValueChange={setSelectedType}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select file type" />
        </SelectTrigger>
        <SelectContent>
          {FILE_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-accent/50',
          !selectedType && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input {...getInputProps()} disabled={!selectedType} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : selectedType
            ? 'Drag & drop files here, or click to select files'
            : 'Please select a file type before uploading'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supports PDF, CSV, JSON, XLS, XLSX
        </p>
      </div>
    </div>
  );
};

export default FileUpload;