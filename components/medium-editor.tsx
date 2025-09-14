"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import csharp from 'highlight.js/lib/languages/csharp'
import sql from 'highlight.js/lib/languages/sql'
import { CodeEditorModal } from '@/components/code-editor-modal'

const low = createLowlight()
low.register({ javascript, python, csharp, sql })

type Props = {
  value?: string
  onChange?: (html: string) => void
  minHeight?: number
}

function getToken(): string | null {
  const m = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )token=([^;]+)/) : null
  return m ? decodeURIComponent(m[1]) : null
}

export function MediumEditor({ value = '', onChange, minHeight = 320 }: Props) {
  const [showCode, setShowCode] = useState(false)
  const [codeLang, setCodeLang] = useState<'javascript' | 'csharp' | 'python' | 'sql'>('javascript')
  const [codeText, setCodeText] = useState('')

  const ResizableImage = useMemo(() => Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          parseHTML: (element: HTMLElement) => (element.getAttribute('width') || (element as HTMLElement).style.width || null),
          renderHTML: (attrs: Record<string, any>) => {
            const styleParts: string[] = []
            if (attrs.width) styleParts.push(`width:${attrs.width}`)
            styleParts.push('height:auto')
            if (attrs.align === 'center') {
              styleParts.push('display:block','margin-left:auto','margin-right:auto')
            } else if (attrs.align === 'left') {
              styleParts.push('float:left','margin-right:1rem')
            } else if (attrs.align === 'right') {
              styleParts.push('float:right','margin-left:1rem')
            }
            return { style: styleParts.join(';') }
          },
        },
        align: { default: null as null | 'left' | 'center' | 'right' },
      }
    },
  }), [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
      TextAlign.configure({ types: ['heading','paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Yazmaya başla…' }),
      Underline,
      CodeBlockLowlight.configure({ lowlight: low }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none bg-[#1f2937] text-white',
        style: `min-height:${minHeight}px; white-space: pre-wrap;`,
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if ((value || '') !== current) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  const uploadImage = useCallback(async (file: File) => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "") as string
    const fd = new FormData()
    fd.append('file', file)
    const token = getToken()
    const res = await fetch(`${base}/api/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    })
    if (!res.ok) throw new Error('Yükleme başarısız')
    const data = await res.json()
    return data.url as string
  }, [])

  const inputRef = useRef<HTMLInputElement | null>(null)
  const onPick = useCallback(() => inputRef.current?.click(), [])
  const onInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    try {
      const url = await uploadImage(file)
      editor.chain().focus().setImage({ src: url, alt: file.name }).updateAttributes('image', { width: '100%' }).run()
    } finally {
      e.target.value = ''
    }
  }, [editor, uploadImage])

  if (!editor) return null
  const canUndo = editor.can().undo()
  const canRedo = editor.can().redo()

  return (
    <div className="rte relative rounded border border-gray-700 bg-[#1f2937]">
      <div className="flex flex-wrap gap-1 border-b border-gray-700 bg-[#111827] px-2 py-1 text-sm text-white">
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" className="px-2 py-1 border rounded italic" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()}>I</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()}>U</button>
        <span className="mx-1 w-px bg-gray-600" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="mx-1 w-px bg-gray-600" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => setShowCode(true)}>Kod</button>
        <span className="mx-1 w-px bg-gray-600" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => (editor as any).chain().focus().setTextAlign('left').run()}>Sol</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => (editor as any).chain().focus().setTextAlign('center').run()}>Ortala</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => (editor as any).chain().focus().setTextAlign('right').run()}>Sağ</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => (editor as any).chain().focus().setTextAlign('justify').run()}>Yasla</button>
        <span className="mx-1 w-px bg-gray-600" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleBulletList().run()}>• Liste</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Liste</button>
        <span className="mx-1 w-px bg-gray-600" />
        <button type="button" className="px-2 py-1 border rounded" onClick={onPick}>Resim Ekle</button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onInputChange} />
        {editor.isActive('image') && (
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-gray-300 mr-1">Görsel genişliği:</span>
            <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { width: '25%' }).run()}>25%</button>
            <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%' }).run()}>50%</button>
            <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { width: '75%' }).run()}>75%</button>
            <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%' }).run()}>100%</button>
            <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { width: null as any }).run()}>Auto</button>
          </div>
        )}
        {editor.isActive('image') && (() => {
          const img = editor.getAttributes('image') as any
          const w = typeof img.width === 'string' && img.width.endsWith('%') ? parseInt(img.width) || 100 : 100
          const setW = (val: number) => editor.chain().focus().updateAttributes('image', { width: `${Math.max(10, Math.min(100, val))}%` }).run()
          return (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-300">Görsel hizalama:</span>
              <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()}>Sol</button>
              <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}>Ortala</button>
              <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}>Sağ</button>
              <span className="mx-1 w-px bg-gray-600" />
              <input type="range" min={10} max={100} value={w} onChange={(e) => setW(parseInt(e.target.value))} />
              <input type="number" min={10} max={100} value={w} onChange={(e) => setW(parseInt(e.target.value))} className="w-16 border rounded px-1 py-0.5" />
            </div>
          )
        })()}
        <span className="mx-1 w-px bg-gray-600" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().undo().run()} disabled={!canUndo}>Geri Al</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().redo().run()} disabled={!canRedo}>İleri Al</button>
      </div>

      <EditorContent editor={editor} className="px-3 py-2" />

      {showCode && (
        <CodeEditorModal
          open={showCode}
          language={codeLang}
          value={codeText}
          onChange={setCodeText}
          onCancel={() => setShowCode(false)}
          onSave={() => {
            if (!editor) return
            const text = (codeText || '').replace(/\r\n?/g, '\n')
            editor.chain().focus().insertContent({ type: 'codeBlock', attrs: { language: codeLang }, content: text ? [{ type: 'text', text }] : [] }).run()
            setShowCode(false)
            setCodeText('')
          }}
        />
      )}
    </div>
  )
}

