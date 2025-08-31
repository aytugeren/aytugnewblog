"use client"
import { useEffect, useRef } from 'react'

type RichTextProps = {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

export function RichTextEditor({ value = '', onChange, placeholder = 'İçerik...', className = '', minHeight = 220 }: RichTextProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  // Initialize or sync external value without disrupting caret position unless changed externally
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if ((value ?? '') !== el.innerHTML) {
      el.innerHTML = value ?? ''
    }
  }, [value])

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg)
    syncHtml()
  }

  const syncHtml = () => {
    const current = ref.current?.innerHTML ?? ''
    onChange?.(current)
  }

  const insertLink = () => {
    const url = prompt('Bağlantı URL')
    if (!url) return
    exec('createLink', url)
  }

  const insertHeading = (tag: 'H1' | 'H2' | 'H3') => {
    exec('formatBlock', tag)
  }

  return (
    <div className={"rounded border " + className}>
      <div className="flex flex-wrap gap-1 border-b bg-gray-50 px-2 py-1 text-sm">
        <button type="button" className="px-2 py-1 border rounded" onClick={() => exec('bold')}><b>B</b></button>
        <button type="button" className="px-2 py-1 border rounded italic" onClick={() => exec('italic')}>I</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => exec('underline')}>U</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => insertHeading('H1')}>H1</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => insertHeading('H2')}>H2</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => insertHeading('H3')}>H3</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => exec('insertUnorderedList')}>• Liste</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => exec('insertOrderedList')}>1. Liste</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => insertLink()}>Link</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => exec('removeFormat')}>Biçimi Temizle</button>
      </div>
      <div
        ref={ref}
        onInput={syncHtml}
        onBlur={syncHtml}
        contentEditable
        suppressContentEditableWarning
        className="prose max-w-none p-3 focus:outline-none min-h-[200px] text-left"
        style={{ minHeight, direction: 'ltr', whiteSpace: 'pre-wrap' as const }}
        data-placeholder={placeholder}
      />
    </div>
  )
}
