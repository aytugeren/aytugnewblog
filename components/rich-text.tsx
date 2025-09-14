"use client"
import { useEffect, useRef, useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'

type RichTextProps = {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

export function RichTextEditor({ value = '', onChange, placeholder = 'İçerik...', className = '', minHeight = 220 }: RichTextProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [codeLang, setCodeLang] = useState<'javascript' | 'csharp' | 'python' | 'sql'>('javascript')
  const [codeText, setCodeText] = useState('')
  const [foreColor, setForeColor] = useState<string>('')
  const [backColor, setBackColor] = useState<string>('')

  // Initialize or sync external value without disrupting caret position unless changed externally
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if ((value ?? '') !== el.innerHTML) {
      el.innerHTML = value ?? ''
      // Re-run highlighting when external value changes
      highlightAll()
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

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const dedent = (code: string) => {
    const lines = code.replace(/\r\n?/g, '\n').split('\n')
    // remove leading/trailing blank lines
    while (lines.length && lines[0].trim() === '') lines.shift()
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
    const indents = lines
      .filter(l => l.trim() !== '')
      .map(l => l.match(/^\s*/)?.[0].length ?? 0)
    const minIndent = indents.length ? Math.min(...indents) : 0
    return lines.map(l => l.slice(minIndent)).join('\n')
  }

  const formatCodeIfPossible = async (code: string, lang: typeof codeLang) => {
    const normalized = dedent(code)
    try {
      if (lang === 'javascript') {
        const prettier = (await import('prettier/standalone')).default
        const babel = (await import('prettier/plugins/babel')).default
        const estree = (await import('prettier/plugins/estree')).default
        return await prettier.format(normalized, { parser: 'babel', plugins: [babel, estree], semi: false })
      }
      if (lang === 'sql') {
        const { format } = await import('sql-formatter')
        return format(normalized, { language: 'postgresql' })
      }
    } catch {}
    return normalized
  }

  const highlightAll = () => {
    const el = ref.current
    if (!el) return
    el.querySelectorAll('pre code').forEach((block) => {
      Prism.highlightElement(block as HTMLElement)
    })
  }

  useEffect(() => {
    highlightAll()
  }, [])

  const insertCodeBlock = async () => {
    const formatted = await formatCodeIfPossible(codeText, codeLang)
    const html = `<pre class="language-${'${codeLang}'}"><code class="language-${'${codeLang}'}">${'${escapeHtml(formatted)}'}</code></pre>`
    document.execCommand('insertHTML', false, html)
    setShowCode(false)
    setCodeText('')
    // Re-highlight newly inserted block
    setTimeout(() => highlightAll(), 0)
    syncHtml()
  }

  return (
    <div className={"rte rounded border relative " + className}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-[#111827] text-white border-gray-700 px-2 py-1 text-sm">
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
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => setShowCode(true)}>Kod</button>
        <label className="ml-2 flex items-center gap-1">
          <span className="text-xs text-gray-600">Yazı Rengi</span>
          <input type="color" value={foreColor} onChange={(e) => { setForeColor(e.target.value); exec('foreColor', e.target.value) }} />
        </label>
        <label className="ml-2 flex items-center gap-1">
          <span className="text-xs text-gray-600">Arkaplan</span>
          <input type="color" value={backColor} onChange={(e) => { setBackColor(e.target.value); exec('hiliteColor', e.target.value) }} />
        </label>
      </div>
      <div
        ref={ref}
        onInput={() => { highlightAll(); syncHtml() }}
        onBlur={() => { highlightAll(); syncHtml() }}
        contentEditable
        suppressContentEditableWarning
        className="prose max-w-none p-3 focus:outline-none min-h-[200px] text-left bg-[#1f2937] text-white"
        style={{ minHeight, direction: 'ltr', whiteSpace: 'pre-wrap' as const }}
        data-placeholder={placeholder}
      />

      {showCode && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Kod Bloğu Ekle</h3>
              <button className="px-2 py-1 border rounded" onClick={() => setShowCode(false)}>Kapat</button>
            </div>
            <div className="mb-2">
              <label className="mr-2 text-sm">Dil:</label>
              <select
                className="border rounded px-2 py-1"
                value={codeLang}
                onChange={(e) => setCodeLang(e.target.value as typeof codeLang)}
              >
                <option value="javascript">JavaScript</option>
                <option value="csharp">C#</option>
                <option value="python">Python</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            <textarea
              className="h-60 w-full resize-y rounded border p-2 font-mono text-sm"
              placeholder="Kodu buraya yapıştırın..."
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-1 rounded border" onClick={() => setShowCode(false)}>Vazgeç</button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={insertCodeBlock}>Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
