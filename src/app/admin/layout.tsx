import type { ReactNode } from 'react'
import { UtfFixer } from '@/components/utf-fixer'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen text-neutral-900">
      {/* Beyaz arka plan: global arkaplan/animasyonları baskılar */}
      <div className="fixed inset-0 bg-white" aria-hidden />

      <div className="relative z-10">
        <header className="border-b bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="font-semibold">Yönetim Paneli</div>
            <nav className="text-sm flex items-center gap-3">
              <a className="underline" href="/admin">Ana Sayfa</a>
              <a className="underline" href="/admin/home">Home JSON</a>
              <a className="underline" href="/admin/home/form">Home Form</a>
              <a className="underline" href="/admin/posts">Postlar</a>
              <a className="underline" href="/admin/contact">İletişim</a>
              <a className="px-3 py-1 rounded border" href="/">Siteye Git</a>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
          <UtfFixer />
        </main>
      </div>
    </div>
  )
}
