import { Editor } from '@tinymce/tinymce-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const BlogEditor = ({ content, onChange }: BlogEditorProps) => {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const fetchApiKey = async () => {
      const { data: { TINYMCE_API_KEY } } = await supabase.functions.invoke('get-secret', {
        body: { secretName: 'TINYMCE_API_KEY' }
      });
      if (TINYMCE_API_KEY) {
        setApiKey(TINYMCE_API_KEY);
      }
    };
    fetchApiKey();
  }, []);

  if (!apiKey) {
    return <div className="min-h-[400px] border rounded-md p-4 bg-muted/20">Loading editor...</div>;
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