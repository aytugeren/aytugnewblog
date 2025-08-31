"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MediumEditor } from '@/components/medium-editor'

type Post = { id: string; title: string; date: string; summary: string; slug: string; tags?: string[]; body?: string; published?: boolean }

function getToken(): string | null {
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams<{ key: string }>()
  const key = params?.key as string
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [summary, setSummary] = useState('')
  const [slug, setSlug] = useState('')
  const [tags, setTags] = useState('')
  const [published, setPublished] = useState<boolean>(true)
  const [body, setBody] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // try as slug first
        let detail: any | null = null
        let r = await fetch(`${base}/api/posts/${encodeURIComponent(key)}`, { cache: 'no-store' })
        if (r.ok) {
          detail = await r.json()
        } else if (/^[a-fA-F0-9]{24}$/.test(key)) {
          // if key is ObjectId, fetch list then fetch by slug
          const listRes = await fetch(`${base}/api/posts`, { cache: 'no-store' })
          if (listRes.ok) {
            const list = await listRes.json() as any[]
            const found = list.find(p => p.id === key)
            if (found?.slug) {
              const r2 = await fetch(`${base}/api/posts/${encodeURIComponent(found.slug)}`, { cache: 'no-store' })
              if (r2.ok) detail = await r2.json()
            }
          }
        }
        if (!detail) throw new Error('Post bulunamadı')
        if (cancelled) return
        setId(detail.id)
        setTitle(detail.title ?? '')
        setDate(detail.date ?? '')
        setSummary(detail.summary ?? '')
        setSlug(detail.slug ?? '')
        setTags(Array.isArray(detail.tags) ? detail.tags.join(', ') : '')
        setPublished(typeof detail.published === 'boolean' ? detail.published : true)
        setBody(detail.body ?? '')
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Hata')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [base, key])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const payload = {
        title,
        date,
        summary,
        slug,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        body,
        published,
      }
      const res = await fetch(`${base}/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Güncelleme başarısız')
      setMsg('Güncellendi')
      router.replace('/admin/posts')
    } catch (e: any) {
      setError(e.message || 'Hata')
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor…</p>
  if (error) return <p className="text-sm text-red-500">{error}</p>

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Postu Düzenle</h1>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">Kaydet</button>
        </div>
      </div>
      {(msg || error) && (<p className={error ? 'text-red-500 text-sm' : 'text-green-500 text-sm'}>{error || msg}</p>)}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm">Başlık</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Tarih</label>
          <input type="date" className="w-full border rounded px-3 py-2 bg-transparent" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Slug</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Etiketler (virgülle)</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm">İçerik</label>
          <label className="text-sm inline-flex items-center gap-2">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Yayınla
          </label>
        </div>
        <MediumEditor value={body} onChange={setBody} minHeight={360} />
      </div>
    </form>
  )
}

