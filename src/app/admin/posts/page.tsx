"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/services/api'

type Post = { id: string; title: string; date: string; summary: string; slug: string; tags?: string[] }

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch('/api/posts')
        if (!res.ok) throw new Error('Postlar alınamadı')
        const data = await res.json()
        setPosts(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e.message || 'Hata')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Postlar</h1>
        <a href="/admin/posts/new" className="px-3 py-1 rounded bg-blue-600 text-white">Yeni Post</a>
      </div>
      {loading && <p className="text-sm text-gray-500">{"Yükleniyor..."}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="divide-y rounded border">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-gray-500">{p.date} — /blog/{p.slug}</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <a className="underline" href={`/blog/${p.slug}`} target="_blank">{"Görüntüle"}</a>
              <a className="underline" href={`/admin/posts/${p.slug}/edit`}>{"Düzenle"}</a>
            </div>
          </div>
        ))}
        {(!loading && posts.length === 0) && (
          <div className="p-3 text-sm text-gray-500">{"Henüz post yok."}</div>
        )}
      </div>
    </div>
  )
}
