"use client"
import { useEffect, useState } from 'react'

type Post = { id: string; title: string; date: string; summary: string; slug: string; tags?: string[] }

export default function AdminPostsPage() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL as string
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncInfo, setSyncInfo] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${base}/api/posts`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Postlar alınamadı')
        const data = await res.json()
        setPosts(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e.message || 'Hata')
      } finally {
        setLoading(false)
      }
    })()
  }, [base])

  const onSync = async () => {
    setSyncError(null)
    setSyncInfo(null)
    setSyncing(true)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const res = await fetch(`${base}/api/posts/sync/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const txt = await res.text()
      if (!res.ok) {
        try {
          const j = JSON.parse(txt)
          throw new Error(j?.error || j?.detail || txt || 'Senkronizasyon başarısız')
        } catch {
          throw new Error(txt || 'Senkronizasyon başarısız')
        }
      }
      let msg = 'Senkron tamamlandı.'
      try {
        const j = JSON.parse(txt)
        if (j && typeof j === 'object') {
          msg = `Senkron tamamlandı: ${j.written}/${j.total} yazıldı. Klasör: ${j.dir}`
        }
      } catch { /* ignore parse */ }
      setSyncInfo(msg)
    } catch (e: any) {
      setSyncError(e?.message || 'Hata')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Postlar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onSync}
            disabled={syncing}
            className="px-3 py-1 rounded border bg-white disabled:opacity-60"
            title="Veritabanındaki tüm postları content/posts içine .mdx olarak yazar"
          >
            {syncing ? 'Senkronize ediliyor…' : 'MDX’e Senkronize Et'}
          </button>
          <a href="/admin/posts/new" className="px-3 py-1 rounded bg-blue-600 text-white">Yeni Post</a>
        </div>
      </div>
      {loading && <p className="text-sm text-gray-500">{"YǬkleniyor..."}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {syncError && <p className="text-sm text-red-500">{syncError}</p>}
      {syncInfo && <p className="text-sm text-green-600">{syncInfo}</p>}
      <div className="divide-y rounded border">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-gray-500">{p.date} �?" /blog/{p.slug}</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <a className="underline" href={`/blog/${p.slug}`} target="_blank">{"G��rǬntǬle"}</a>
              <a className="underline" href={`/admin/posts/${p.slug}/edit`}>{"DǬzenle"}</a>
            </div>
          </div>
        ))}
        {(!loading && posts.length === 0) && (
          <div className="p-3 text-sm text-gray-500">{"HenǬz post yok."}</div>
        )}
      </div>
    </div>
  )
}

function getToken(): string | null {
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}
