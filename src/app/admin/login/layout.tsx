import type { ReactNode } from 'react'
import { UtfFixer } from '@/components/utf-fixer'

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen text-neutral-900">
      {/* Beyaz arka plan: site arkaplanını baskılar */}
      <div className="fixed inset-0 bg-white" aria-hidden />
      <div className="relative z-10">
        {/* Sadece amblem/başlık, navbar yok */}
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="inline-flex items-center gap-2 font-semibold">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              Yönetim Paneli
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          {children}
          <UtfFixer />
        </main>
      </div>
    </div>
  )
}
