import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
  danger,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`
        px-2 py-1 rounded text-sm font-medium transition-colors select-none
        ${active
          ? 'bg-blue-600 text-white'
          : danger
            ? 'bg-transparent text-red-500 hover:bg-red-50'
            : 'bg-transparent text-gray-700 hover:bg-gray-100'}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-300 mx-1 self-center" />;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[320px] px-4 py-3 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  const exportToDoc = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const wordHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Regulamento</title>
<style>
body{font-family:Calibri,sans-serif;font-size:12pt;margin:2cm}
h1{font-size:18pt;font-weight:bold}h2{font-size:16pt;font-weight:bold}
h3{font-size:14pt;font-weight:bold}h4{font-size:12pt;font-weight:bold}
p{margin:6pt 0;line-height:1.5}ul,ol{margin:6pt 0 6pt 24pt}li{margin:3pt 0}
table{border-collapse:collapse;width:100%;margin:12pt 0}
td,th{border:1pt solid #999;padding:4pt 8pt}th{background:#f0f0f0;font-weight:bold}
blockquote{border-left:4pt solid #ccc;margin-left:12pt;padding-left:8pt;color:#666}
</style></head><body>${html}</body></html>`;
    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regulamento.doc';
    a.click();
    URL.revokeObjectURL(url);
  }, [editor]);

  if (!editor) return null;

  const headingValue = editor.isActive('heading', { level: 1 }) ? '1'
    : editor.isActive('heading', { level: 2 }) ? '2'
    : editor.isActive('heading', { level: 3 }) ? '3'
    : editor.isActive('heading', { level: 4 }) ? '4'
    : '0';

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        {/* Heading style */}
        <select
          title="Estilo de texto"
          value={headingValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '0') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(val) as 1|2|3|4 }).run();
          }}
          className="text-sm border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none mr-1"
        >
          <option value="0">Parágrafo</option>
          <option value="1">Título 1</option>
          <option value="2">Título 2</option>
          <option value="3">Título 3</option>
          <option value="4">Título 4</option>
        </select>

        <Divider />

        {/* Formatting */}
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito (Ctrl+B)">
          <strong>N</strong>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico (Ctrl+I)">
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado (Ctrl+U)">
          <u>S</u>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <s>T</s>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Realçar">
          <span className="bg-yellow-200 px-0.5 text-xs">A</span>
        </ToolbarBtn>

        <Divider />

        {/* Alignment */}
        <ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Esquerda">⬅</ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centro">⬛</ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Direita">➡</ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justificar">≡</ToolbarBtn>

        <Divider />

        {/* Lists */}
        <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista com marcadores">• Lista</ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">1. Lista</ToolbarBtn>

        <Divider />

        {/* Indent */}
        <ToolbarBtn active={false} onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Aumentar recuo">→|</ToolbarBtn>
        <ToolbarBtn active={false} onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Diminuir recuo">|←</ToolbarBtn>

        <Divider />

        {/* Table */}
        <ToolbarBtn active={false} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Inserir tabela">
          ⊞ Tab
        </ToolbarBtn>
        {editor.isActive('table') && (
          <>
            <ToolbarBtn active={false} onClick={() => editor.chain().focus().addColumnAfter().run()} title="+ Coluna">+Col</ToolbarBtn>
            <ToolbarBtn active={false} onClick={() => editor.chain().focus().addRowAfter().run()} title="+ Linha">+Lin</ToolbarBtn>
            <ToolbarBtn active={false} danger onClick={() => editor.chain().focus().deleteTable().run()} title="Excluir tabela">✕Tab</ToolbarBtn>
          </>
        )}

        <Divider />

        {/* Quote / HR */}
        <ToolbarBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">" "</ToolbarBtn>
        <ToolbarBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">───</ToolbarBtn>

        <Divider />

        {/* Undo / Redo */}
        <ToolbarBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="Desfazer (Ctrl+Z)">↩</ToolbarBtn>
        <ToolbarBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="Refazer (Ctrl+Y)">↪</ToolbarBtn>

        <Divider />

        {/* Export .doc */}
        <button
          type="button"
          onClick={exportToDoc}
          title="Baixar como Word (.doc)"
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded ml-1 transition-colors"
        >
          📄 Baixar .doc
        </button>
      </div>

      {/* Editor area */}
      <div className="bg-white cursor-text relative" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
        {!editor.getText().trim() && (
          <p className="absolute top-3 left-4 text-gray-400 pointer-events-none text-sm select-none">
            {placeholder || 'Clique aqui e comece a redigir o regulamento...'}
          </p>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
        <span>{editor.getText().length} caracteres · {editor.getText().split(/\s+/).filter(Boolean).length} palavras</span>
        <span>Ctrl+B Negrito · Ctrl+I Itálico · Ctrl+U Sublinhado</span>
      </div>
    </div>
  );
}
