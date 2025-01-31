import { useEffect } from 'react';
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

  return (
    <div className="border rounded-md">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full min-h-[400px] p-4 rounded-md",
          "font-mono text-base leading-relaxed",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "resize-y",
          "whitespace-pre-wrap",
          "[&]:prose [&]:max-w-none",
          "bg-background"
        )}
        placeholder="Enter or paste your blog content here..."
      />
    </div>
  );
};

export default BlogEditor;