"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, List, ListOrdered, Table as TableIcon,
  Undo, Redo, Heading2, Strikethrough, Code
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  label
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] p-4 text-sm sm:text-base',
        placeholder,
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-white">{label}</label>}

      <div className="border border-slate-700 rounded-lg bg-slate-900 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-slate-700 p-2 flex flex-wrap gap-1 bg-slate-800/50">
          {/* Text Formatting */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 px-2 ${editor.isActive('bold') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 px-2 ${editor.isActive('italic') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-8 px-2 ${editor.isActive('strike') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`h-8 px-2 ${editor.isActive('code') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          {/* Heading */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-8 px-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Heading"
          >
            <Heading2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          {/* Lists */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 px-2 ${editor.isActive('bulletList') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 px-2 ${editor.isActive('orderedList') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          {/* Table */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            className="h-8 px-2 text-slate-400 hover:text-white"
            title="Insert 3x3 Table"
          >
            <TableIcon className="w-4 h-4" />
          </Button>

          {editor.isActive('table') && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                title="Add column before"
              >
                Col←
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                title="Add column after"
              >
                Col→
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                title="Add row before"
              >
                Row↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                title="Add row after"
              >
                Row↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="h-8 px-2 text-xs text-red-400 hover:text-red-300"
                title="Delete column"
              >
                Del Col
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="h-8 px-2 text-xs text-red-400 hover:text-red-300"
                title="Delete row"
              >
                Del Row
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="h-8 px-2 text-xs text-red-400 hover:text-red-300"
                title="Delete entire table"
              >
                Del Table
              </Button>
            </>
          )}

          <div className="flex-1" />

          {/* Undo/Redo */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 px-2 text-slate-400 hover:text-white disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 px-2 text-slate-400 hover:text-white disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="editor-wrapper">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-slate-500">
        Supports <strong>bold</strong>, <em>italic</em>, lists, tables, and more. Use the toolbar above to format your text.
      </p>

      <style jsx global>{`
        /* Override all possible conflicting styles */
        .editor-wrapper .ProseMirror table,
        .editor-wrapper .ProseMirror .tiptap-table {
          display: table !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          table-layout: fixed !important;
          width: 100% !important;
          margin: 1rem 0 !important;
          overflow: visible !important;
          border: 4px solid #a855f7 !important;
          background-color: #334155 !important;
        }

        .editor-wrapper .ProseMirror table td,
        .editor-wrapper .ProseMirror table th,
        .editor-wrapper .ProseMirror .tiptap-table td,
        .editor-wrapper .ProseMirror .tiptap-table th {
          min-width: 120px !important;
          min-height: 45px !important;
          height: 45px !important;
          border: 3px solid #a855f7 !important;
          padding: 12px !important;
          vertical-align: top !important;
          box-sizing: border-box !important;
          position: relative !important;
          background-color: #1e293b !important;
          color: #ffffff !important;
        }

        .editor-wrapper .ProseMirror table th,
        .editor-wrapper .ProseMirror .tiptap-table th {
          font-weight: 700 !important;
          text-align: left !important;
          background-color: #7c3aed !important;
          color: #ffffff !important;
        }

        .editor-wrapper .ProseMirror table p,
        .editor-wrapper .ProseMirror .tiptap-table p {
          margin: 0 !important;
          color: #ffffff !important;
        }

        .tiptap-table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(168, 85, 247, 0.4) !important;
          pointer-events: none;
        }

        .tiptap-table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #a855f7 !important;
          pointer-events: none;
        }

        .editor-wrapper .ProseMirror {
          min-height: 150px;
          padding: 1rem;
          color: white;
        }

        .editor-wrapper .ProseMirror:focus {
          outline: none;
        }

        .editor-wrapper .ProseMirror p {
          margin: 0.5rem 0;
        }

        .editor-wrapper .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
        }

        .editor-wrapper .ProseMirror ul,
        .editor-wrapper .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .editor-wrapper .ProseMirror li {
          margin: 0.25rem 0;
        }

        .editor-wrapper .ProseMirror code {
          background-color: #334155;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: monospace;
        }

        .editor-wrapper .ProseMirror pre {
          background-color: #1e293b;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }

        .editor-wrapper .ProseMirror pre code {
          background: none;
          padding: 0;
        }

        .editor-wrapper .ProseMirror strong {
          font-weight: 600;
        }

        .editor-wrapper .ProseMirror em {
          font-style: italic;
        }

        .editor-wrapper .ProseMirror s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
