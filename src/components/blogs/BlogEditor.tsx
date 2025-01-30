import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Heading2,
  Code,
  Undo,
  Redo
} from "lucide-react";

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const BlogEditor = ({ content, onChange }: BlogEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content
      .replace(/\n/g, '<br>') // Convert line breaks to HTML breaks
      .replace(/[^\x20-\x7E\n]/g, '') // Remove special characters except newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim(), // Remove leading/trailing whitespace
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML()
        .replace(/<br\s*\/?>/g, '\n') // Convert HTML breaks back to line breaks
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces with regular spaces
        .replace(/\n{3,}/g, '\n\n') // Replace multiple consecutive line breaks with double line breaks
        .replace(/[^\x20-\x7E\n]/g, '') // Remove special characters except newlines
        .trim(); // Remove leading/trailing whitespace
      onChange(newContent);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none whitespace-pre-wrap leading-relaxed'
      }
    }
  });

  if (!editor) {
    return null;
  }

  const handleToolbarClick = (e: React.MouseEvent, action: () => boolean) => {
    e.preventDefault(); // Prevent form submission
    editor.chain().focus();
    action();
  };

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 bg-muted/20 flex flex-wrap gap-1">
        <Button
          type="button" // Explicitly set type to button
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().toggleBold().run())}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().toggleItalic().run())}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().toggleBulletList().run())}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().toggleOrderedList().run())}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().toggleBlockquote().run())}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().toggleCodeBlock().run())}
          className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().undo().run())}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleToolbarClick(e, () => editor.chain().focus().redo().run())}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default BlogEditor;