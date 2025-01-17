import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

interface LogoUploadProps {
  currentLogo?: string | null;
  onUpload: (url: string) => void;
}

const LogoUpload = ({ currentLogo, onUpload }: LogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('client-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-logos')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error('Error uploading logo');
      console.error('Error:', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    onUpload('');
  };

  return (
    <div className="space-y-4">
      {currentLogo ? (
        <div className="relative w-32 h-32">
          <img
            src={currentLogo}
            alt="Client logo"
            className="w-full h-full object-contain rounded-lg border"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2"
            onClick={handleRemoveLogo}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg">
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-1 text-sm text-muted-foreground">Upload logo</p>
          </div>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="logo-upload"
        disabled={isUploading}
      />
      <Button
        asChild
        variant="outline"
        className="w-32"
        disabled={isUploading}
      >
        <label htmlFor="logo-upload" className="cursor-pointer">
          {isUploading ? 'Uploading...' : 'Choose Logo'}
        </label>
      </Button>
    </div>
  );
};

export default LogoUpload;