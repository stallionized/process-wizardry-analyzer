import { useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from "@/lib/utils";

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const BlogEditor = ({ content, onChange }: BlogEditorProps) => {
  useEffect(() => {
    // Initialize with content if provided
    if (content) {
      onChange(content);
    }
  }, []);

  const modules = {
    toolbar: [
      [{ 'header': [2, false] }],
      ['bold', 'italic'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic',
    'blockquote', 'code-block',
    'list', 'bullet'
  ];

  return (
    <div className="border rounded-md">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className={cn(
          "min-h-[400px]",
          "[&_.ql-container]:!min-h-[350px]",
          "[&_.ql-editor]:min-h-[350px]",
          "[&_.ql-toolbar]:border-b",
          "[&_.ql-toolbar]:bg-muted/20",
          "[&_.ql-container]:border-0",
          "[&_.ql-editor]:prose",
          "[&_.ql-editor]:max-w-none"
        )}
      />
    </div>
  );
};

export default BlogEditor;