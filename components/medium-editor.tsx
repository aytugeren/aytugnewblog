"use client"
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'

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
  // Extend Image: width + align via inline styles
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
        align: {
          default: null as null | 'left' | 'center' | 'right',
        },
      }
    },
  }), [])
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ['heading','paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Yazmaya başla…' }),
      Underline,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
        style: `min-height:${minHeight}px;`
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if ((value || '') !== current) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  const uploadImage = useCallback(async (file: File) => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!base) throw new Error('API base URL tanımlı değil')
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
    } catch (err) {
      // ignore for now; could show toast
    } finally {
      e.target.value = ''
    }
  }, [editor, uploadImage])

  if (!editor) return null
  const canUndo = editor.can().undo()
  const canRedo = editor.can().redo()

  return (
    <div className="rounded border bg-white">
      <div className="flex flex-wrap gap-1 border-b bg-gray-50 px-2 py-1 text-sm">
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" className="px-2 py-1 border rounded italic" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()}>I</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()}>U</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="mx-1 w-px bg-gray-300" />
        {/* Text alignment */}
        <button type="button" className="px-2 py-1 border rounded" onClick={() => (editor as any).chain().focus().setTextAlign('left').run()}>Sol</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => (editor as any).chain().focus().setTextAlign('center').run()}>Ortala</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => (editor as any).chain().focus().setTextAlign('right').run()}>Sağ</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => (editor as any).chain().focus().setTextAlign('justify').run()}>Yasla</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().setTextAlign('left').run()}>Sol</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().setTextAlign('center').run()}>Ortala</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().setTextAlign('right').run()}>Sağ</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().setTextAlign('justify').run()}>Yasla</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleBulletList().run()}>• Liste</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Liste</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={onPick}>Resim Ekle</button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onInputChange} />
        {editor.isActive('image') && (
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-gray-500 mr-1">Görsel genişliği:</span>
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
              <span className="text-xs text-gray-500">Görsel hizalama:</span>
              <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()}>Sol</button>
              <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}>Ortala</button>
              <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}>Sağ</button>
              <span className="mx-1 w-px bg-gray-300" />
              <input type="range" min={10} max={100} value={w} onChange={(e) => setW(parseInt(e.target.value))} />
              <input type="number" min={10} max={100} value={w} onChange={(e) => setW(parseInt(e.target.value))} className="w-16 border rounded px-1 py-0.5" />
            </div>
          )
        })()}
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().undo().run()} disabled={!canUndo}>Geri Al</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor.chain().focus().redo().run()} disabled={!canRedo}>İleri Al</button>
      </div>
      <EditorContent editor={editor} className="px-3 py-2" />
    </div>
  )
}
