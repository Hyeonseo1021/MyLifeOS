import { useEffect, useRef } from 'react';
import '@blocknote/core/fonts/inter.css';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

interface EditorProps {
  initialContent?: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

export default function Editor({ initialContent, onChange, editable = true }: EditorProps) {
  const editor = useCreateBlockNote();
  const isLoaded = useRef(false);

  useEffect(() => {
    async function loadContent() {
      if (initialContent && !isLoaded.current && editor) {
        const blocks = await editor.tryParseHTMLToBlocks(initialContent);
        editor.replaceBlocks(editor.document, blocks);
        isLoaded.current = true;
      }
    }
    loadContent();
  }, [editor]);

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.bn-editor') || target.closest('.bn-side-menu')) return;
    
    if (editor) {
      editor.focus();
    }
  };

  return (
    <div 
      className="w-full h-full cursor-text overflow-y-auto"
      onClick={handleContainerClick}
      style={{ 
        WebkitAppRegion: 'no-drag', 
        userSelect: 'text' 
      } as any}
    >
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme="dark" 
        onChange={async () => {
          const html = await editor.blocksToFullHTML(editor.document);
          onChange(html);
        }}
        className="min-h-full"
      />
      
      <style>{`
        :root, :host, .bn-editor, .bn-block-content {
          --bn-colors-editor-background: transparent !important;
          background-color: transparent !important;
        }
        .bn-editor {
          min-height: 100% !important;
          padding-bottom: 30vh !important;
          padding-left: 0 !important; /* 들여쓰기 보정 */
          padding-right: 0 !important;
        }
        /* 불필요한 테두리나 배경 제거 */
        .mantine-Paper-root {
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}