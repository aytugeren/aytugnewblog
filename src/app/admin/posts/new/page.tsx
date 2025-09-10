"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MediumEditor } from '@/components/medium-editor'

function getToken(): string | null {
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

function slugify(input: string): string {
  if (!input) return 'post'
  let s = input.toLowerCase().trim()
  const map: Record<string, string> = {
    'ğ': 'g', 'Ğ': 'g',
    'ü': 'u', 'Ü': 'u',
    'ş': 's', 'Ş': 's',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ç': 'c', 'Ç': 'c',
  }
  s = s.replace(/[ğĞüÜşŞıİöÖçÇ]/g, ch => (map as any)[ch] || ch)
       .replace(/[^a-z0-9\s-]/g, '')
       .replace(/[\s-]+/g, '-')
       .replace(/^-+|-+$/g, '')
  return s || 'post'
}

export default function NewPostPage() {
  const router = useRouter()
  const base = process.env.NEXT_PUBLIC_API_BASE_URL as string
  const today = new Date().toISOString().slice(0, 10)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [summary, setSummary] = useState('')
  const [slug, setSlug] = useState('')
  const [tags, setTags] = useState('')
  const [published, setPublished] = useState(true)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const autoSlug = () => setSlug(slugify(title))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMsg(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const payload = {
        title,
        date,
        summary,
        slug: slug || slugify(title),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        body,
        published,
      }
      const res = await fetch(`${base}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (res.status === 409) throw new Error('Slug zaten mevcut')
      if (!res.ok) throw new Error('Kayıt başarısız')
      setMsg('Oluşturuldu')
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
        <h1 className="text-2xl font-semibold">Yeni Yazı</h1>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50">Kaydet</button>
        </div>
      </div>
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
            <input className="w-full border rounded px-3 py-2 bg-transparent" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={"otomatik üretmek için boş bırakın"} />
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


