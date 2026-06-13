'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, label, minHeight = 150 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  if (!editor) return null;

  const ToolBtn = ({ action, active, label: btnLabel }: { action: () => void; active: boolean; label: string }) => (
    <button
      type="button"
      onClick={action}
      className={`px-2 py-1 text-sm rounded transition-colors ${active ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
      style={{ color: active ? 'var(--primary)' : 'var(--text-light)' }}
    >
      {btnLabel}
    </button>
  );

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-1 px-2 py-1.5 border-b bg-gray-50 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          <ToolBtn action={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="B" />
          <ToolBtn action={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="I" />
          <ToolBtn action={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label="U" />
          <span className="w-px bg-gray-300 mx-1" />
          <ToolBtn action={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="• List" />
          <ToolBtn action={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="1. List" />
          <span className="w-px bg-gray-300 mx-1" />
          <ToolBtn action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="H3" />
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
