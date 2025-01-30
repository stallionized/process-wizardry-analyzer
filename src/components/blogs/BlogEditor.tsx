import { Editor } from '@tinymce/tinymce-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const BlogEditor = ({ content, onChange }: BlogEditorProps) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error: functionError } = await supabase.functions.invoke('get-secret', {
          body: { secretName: 'TINYMCE_API_KEY' }
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (!data?.TINYMCE_API_KEY) {
          throw new Error('TinyMCE API key not found');
        }

        setApiKey(data.TINYMCE_API_KEY);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load editor API key';
        setError(errorMessage);
        toast({
          title: "Editor Error",
          description: errorMessage,
          variant: "destructive",
        });
        console.error('Error fetching TinyMCE API key:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] border rounded-md p-4 bg-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] border rounded-md p-4 bg-destructive/10 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive font-medium">Failed to load editor</p>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
      </div>
    );
  }

  return (
    <Editor
      apiKey={apiKey}
      init={{
        height: 400,
        menubar: true,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
      }}
      value={content}
      onEditorChange={(newContent) => onChange(newContent)}
    />
  );
};

export default BlogEditor;