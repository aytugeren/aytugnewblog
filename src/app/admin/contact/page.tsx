"use client"
import { useEffect, useState } from 'react'

type Contact = {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
  ip?: string | null
  userAgent?: string | null
}

function getToken(): string | null {
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function AdminContactPage() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
  const [items, setItems] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)
  const [limit, setLimit] = useState(50)

  const load = async () => {
    setLoading(true)
    setError(null)
    setMsg(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const res = await fetch(`${base}/api/contact?skip=${skip}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Talepler yüklenemedi')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, limit])

  const remove = async (id: string) => {
    if (!confirm('Talep silinsin mi?')) return
    setLoading(true)
    setError(null)
    setMsg(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const res = await fetch(`${base}/api/contact/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Silme başarısız')
      setMsg('Silindi')
      await load()
    } catch (e: any) {
      setError(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">İletişim Talepleri</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} disabled={loading} className="px-3 py-1 border rounded disabled:opacity-50">Yenile</button>
        </div>
      </div>
      {(error || msg) && (
        <p className={error ? 'text-red-500 text-sm' : 'text-green-600 text-sm'}>{error || msg}</p>
      )}

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Ad</th>
              <th className="px-3 py-2">E-posta</th>
              <th className="px-3 py-2">Mesaj</th>
              <th className="px-3 py-2 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 whitespace-nowrap">{new Date(c.createdAt).toLocaleString('tr-TR')}</td>
                <td className="px-3 py-2 whitespace-nowrap">{c.name}</td>
                <td className="px-3 py-2 whitespace-nowrap"><a className="underline" href={`mailto:${c.email}`}>{c.email}</a></td>
                <td className="px-3 py-2">
                  <div className="max-w-[520px] whitespace-pre-wrap break-words">{c.message}</div>
                  {(c.ip || c.userAgent) && (
                    <div className="mt-1 text-xs text-gray-500">{c.ip} {c.userAgent ? `• ${c.userAgent}` : ''}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-right"><button onClick={() => remove(c.id)} className="px-2 py-1 text-sm rounded border">Sil</button></td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>Henüz talep yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setSkip(Math.max(0, skip - limit))} disabled={skip === 0 || loading} className="px-3 py-1 border rounded disabled:opacity-50">Önceki</button>
        <button onClick={() => setSkip(skip + limit)} disabled={loading} className="px-3 py-1 border rounded disabled:opacity-50">Sonraki</button>
        <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value) || 50)} className="px-2 py-1 border rounded">
          {[20, 50, 100, 200].map((n) => (
            <option key={n} value={n}>{n}/sayfa</option>
          ))}
        </select>
      </div>
    </div>
  )
}

