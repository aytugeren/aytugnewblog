"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MediumEditor } from '@/components/medium-editor'

function getToken(): string | null {
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

function slugify(input: string): string {
  if (!input) return 'post'
  let s = input.toLowerCase().trim()
  const map: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  } as any
  s = s
    .split('')
    .map((ch) => (map as any)[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'post'
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams<{ key: string }>()
  const slugParam = useMemo(() => decodeURIComponent(String(params?.key ?? '')), [params])
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000'

  const [id, setId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [summary, setSummary] = useState('')
  const [slug, setSlug] = useState('')
  const [tags, setTags] = useState('')
  const [published, setPublished] = useState(true)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const autoSlug = () => setSlug(slugify(title))

  useEffect(() => {
    ;(async () => {
      if (!slugParam) return
      setLoading(true)
      setError(null)
      setMsg(null)
      try {
        const res = await fetch(`${base}/api/posts/${encodeURIComponent(slugParam)}`, { cache: 'no-store' })
        if (res.status === 404) throw new Error('Yazı bulunamadı')
        if (!res.ok) throw new Error('Post yüklenemedi')
        const p = await res.json()
        setId(p.id ?? null)
        setTitle(p.title ?? p.Title ?? '')
        setDate(p.date ?? p.Date ?? '')
        setSummary(p.summary ?? p.Summary ?? '')
        setSlug(p.slug ?? p.Slug ?? '')
        setTags(Array.isArray(p.tags ?? p.Tags) ? (p.tags ?? p.Tags).join(', ') : '')
        setBody(p.body ?? p.Body ?? '')
        setPublished(Boolean(p.published ?? p.Published ?? true))
      } catch (e: any) {
        setError(e.message || 'Hata')
      } finally {
        setLoading(false)
      }
    })()
  }, [base, slugParam])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMsg(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      if (!id) throw new Error('Geçersiz yazı')
      const payload = {
        title,
        date,
        summary,
        slug: slug || slugify(title),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        body,
        published,
      }
      const res = await fetch(`${base}/api/posts/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (res.status === 409) throw new Error('Slug zaten mevcut')
      if (!res.ok) throw new Error('Güncelleme başarısız')
      setMsg('Güncellendi')
      router.replace('/admin/posts')
    } catch (e: any) {
      setError(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Yazıyı Düzenle</h1>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50">Kaydet</button>
        </div>
      </div>
      {loading && <p className="text-sm text-gray-500">Yükleniyor…</p>}
      {(error || msg) && (<p className={error ? 'text-red-500 text-sm' : 'text-green-500 text-sm'}>{error || msg}</p>)}

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
          <div className="flex gap-2">
            <input className="w-full border rounded px-3 py-2 bg-transparent" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={'otomatik üretmek için boş bırakın'} />
            <button type="button" className="px-3 py-1 border rounded" onClick={autoSlug}>Otomatik</button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm">Etiketler (virgülle)</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, dotnet, mongodb" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm">Özet</label>
        <textarea className="w-full min-h-[80px] border rounded px-3 py-2 bg-transparent" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm">İçerik (Rich Text)</label>
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
