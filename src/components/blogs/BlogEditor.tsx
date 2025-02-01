import { useState, useEffect } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromHTML, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
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
  const [editorState, setEditorState] = useState(() => {
    if (content) {
      const blocksFromHTML = convertFromHTML(content);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
  });

  useEffect(() => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    const html = convertRawToHTML(rawContent);
    onChange(html);
  }, [editorState, onChange]);

  const handleKeyCommand = (command: string, state: EditorState) => {
    const newState = RichUtils.handleKeyCommand(state, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleBlockType = (blockType: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const toggleInlineStyle = (inlineStyle: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  const convertRawToHTML = (rawContent: any) => {
    let html = '';
    rawContent.blocks.forEach((block: any) => {
      // Handle block type
      switch (block.type) {
        case 'header-two':
          html += `<h2>${block.text}</h2>`;
          break;
        case 'blockquote':
          html += `<blockquote>${block.text}</blockquote>`;
          break;
        case 'unordered-list-item':
          html += `<ul><li>${block.text}</li></ul>`;
          break;
        case 'ordered-list-item':
          html += `<ol><li>${block.text}</li></ol>`;
          break;
        case 'code-block':
          html += `<pre><code>${block.text}</code></pre>`;
          break;
        default:
          html += `<p>${block.text}</p>`;
      }
    });
    return html;
  };

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 bg-muted/20 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleInlineStyle('BOLD')}
          className={editorState.getCurrentInlineStyle().has('BOLD') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleInlineStyle('ITALIC')}
          className={editorState.getCurrentInlineStyle().has('ITALIC') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleBlockType('header-two')}
          className={RichUtils.getCurrentBlockType(editorState) === 'header-two' ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleBlockType('unordered-list-item')}
          className={RichUtils.getCurrentBlockType(editorState) === 'unordered-list-item' ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleBlockType('ordered-list-item')}
          className={RichUtils.getCurrentBlockType(editorState) === 'ordered-list-item' ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleBlockType('blockquote')}
          className={RichUtils.getCurrentBlockType(editorState) === 'blockquote' ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleBlockType('code-block')}
          className={RichUtils.getCurrentBlockType(editorState) === 'code-block' ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditorState(EditorState.undo(editorState))}
          disabled={editorState.getUndoStack().size === 0}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditorState(EditorState.redo(editorState))}
          disabled={editorState.getRedoStack().size === 0}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <div className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
        />
      </div>
    </div>
  );
};

export default BlogEditor;