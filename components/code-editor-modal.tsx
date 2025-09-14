"use client"
import { useEffect, useMemo, useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

type Props = {
  open: boolean
  language: 'javascript' | 'typescript' | 'csharp' | 'python' | 'sql'
  value: string
  onChange: (v: string) => void
  onCancel: () => void
  onSave: () => void
}

export function CodeEditorModal({ open, language, value, onChange, onCancel, onSave }: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    // Sensible defaults for a pleasant editing experience
    editor.updateOptions({
      automaticLayout: true,
      fontSize: 14,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      minimap: { enabled: false },
      formatOnType: true,
      formatOnPaste: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      bracketPairColorization: { enabled: true },
    })
  }

  useEffect(() => {
    // try to set dark theme explicitly
    if (typeof window !== 'undefined') {
      try {
        ;(window as any).monaco?.editor?.setTheme('vs-dark')
      } catch {}
    }
  }, [open])

  if (!open) return null
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded bg-[#0b1020] text-white shadow-xl ring-1 ring-black/50">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="text-sm opacity-80">Kod Düzenleyici</div>
          <div className="flex gap-2">
            <button className="rounded border border-white/20 px-2 py-1 text-sm" onClick={async () => {
              const ed = editorRef.current
              // Try Monaco format action
              await ed?.getAction('editor.action.formatDocument')?.run()
            }}>Formatla</button>
            <button className="rounded bg-blue-600 px-3 py-1 text-sm" onClick={onSave}>Ekle</button>
            <button className="rounded border border-white/20 px-2 py-1 text-sm" onClick={onCancel}>Kapat</button>
          </div>
        </div>
        <div className="h-[60vh]">
          <Editor
            onMount={onMount}
            theme="vs-dark"
            height="60vh"
            language={language}
            value={value}
            onChange={(v) => onChange(v ?? '')}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
    </div>
  )
}

