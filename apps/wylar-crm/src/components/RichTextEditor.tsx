'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Link2 } from 'lucide-react';
import clsx from 'clsx';

/**
 * Editor de texto enriquecido (WYSIWYG) usado por ProfileWizard.tsx para
 * los 6 bloques de contenido de la plantilla ESTANDAR y la descripción
 * larga. Guarda/recibe HTML plano (editor.getHTML()) — wylar.cl lo renderiza
 * tal cual con set:html (ver apps/wylar/src/components/perfil-templates/
 * FichaEstandar.astro), así el formato (negritas, listas, etc.) se respeta
 * en el sitio público sin pasos intermedios.
 *
 * Barra de herramientas deliberadamente acotada (negrita, cursiva, título,
 * listas, link) — cubre lo que pide un texto de ficha, sin exponer nada
 * que pueda romper el diseño de la página (tamaños de fuente libres,
 * colores, tablas, etc.).
 */
export function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ heading: { levels: [3] } }),
            Link.configure({ openOnClick: false, autolink: true }),
            Placeholder.configure({ placeholder: placeholder ?? 'Escribe aquí...' }),
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none min-h-[140px] px-4 py-3 focus:outline-none prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5',
            },
        },
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    if (!editor) {
        return <div className="min-h-[180px] bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />;
    }

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#0B1E40]/20 focus-within:border-[#0B1E40] transition-all">
            {/* La extensión Placeholder solo agrega la clase — el estilo visual es nuestro. */}
            <style>{`
                .is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #94a3b8;
                    pointer-events: none;
                    height: 0;
                }
            `}</style>
            <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
                <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
                    <Bold size={15} />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
                    <Italic size={15} />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtítulo">
                    <Heading2 size={15} />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista con viñetas">
                    <List size={15} />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
                    <ListOrdered size={15} />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('link')}
                    onClick={() => {
                        const prev = editor.getAttributes('link').href as string | undefined;
                        const url = window.prompt('URL del enlace (déjalo vacío para quitarlo):', prev ?? 'https://');
                        if (url === null) return;
                        if (url.trim() === '') {
                            editor.chain().focus().unsetLink().run();
                        } else {
                            editor.chain().focus().setLink({ href: url.trim() }).run();
                        }
                    }}
                    title="Enlace"
                >
                    <Link2 size={15} />
                </ToolbarButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

function ToolbarButton({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            title={title}
            className={clsx('p-1.5 rounded-md transition-colors', active ? 'bg-[#0B1E40] text-white' : 'text-slate-500 hover:bg-slate-200')}
        >
            {children}
        </button>
    );
}
