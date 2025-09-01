"use client"
import { useEffect, useState } from 'react'

type HomeData = {
  Id?: string
  Skills: Record<string, { Name: string; Level: string }[]>
  Experiences: { CompanyName: string; Tag: string; BeginDate: string; EndDate: string; WorkDescription: string }[]
  Projects: { ProjectName: string; ProjectTechnologies: string; ProductDescription: string; ProjectLink?: string | null }[]
  Posts: any[]
  HasCv: boolean
  OngoingProjects: { Name: string; Percent: number }[]
  HeroTitle?: string;
  HeroSubtitle?: string;
}

const SAMPLE: HomeData = {
  Skills: {
    Languages: [
      { Name: 'TypeScript', Level: 'advanced' },
      { Name: 'C#', Level: 'advanced' },
    ],
    Tools: [{ Name: 'MongoDB', Level: 'intermediate' }],
  },
  Experiences: [
    { CompanyName: 'Åirket', Tag: 'Fullstack', BeginDate: '2024-01', EndDate: '2025-08', WorkDescription: 'AÃ§Ä±klama' },
  ],
  Projects: [
    { ProjectName: 'Projex', ProjectTechnologies: 'Next.js, .NET', ProductDescription: 'AÃ§Ä±klama', ProjectLink: '' },
  ],
  Posts: [],
  HasCv: false,
  OngoingProjects: [{ Name: 'Blog', Percent: 60 }],
}

export default function AdminHomeDataPage() {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

  useEffect(() => {
    refresh()
  }, [])

  const refresh = async () => {
    setLoading(true)
    setMsg(null)
    setErr(null)
    try {
      const res = await fetch(`${base}/api/home`)
      if (res.status === 404) {
        setJsonText(JSON.stringify(SAMPLE, null, 2))
        setMsg('HenÃ¼z veri yok. Åablon Yüklendi.')
        return
      }
      if (!res.ok) throw new Error('HomeData yÃ¼klenemedi')
      const data = await res.json()
      setJsonText(JSON.stringify(data, null, 2))
      setMsg('Yüklendi')
    } catch (e: any) {
      setErr(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  const upsert = async () => {
    setLoading(true)
    setMsg(null)
    setErr(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadıÄ±')
      const body = JSON.parse(jsonText)
      const res = await fetch(`${base}/api/home/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Kaydetme başarısız')
      setMsg('Kaydedildi')
      await refresh()
    } catch (e: any) {
      setErr(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  const removeAll = async () => {
    if (!confirm('HomeData silinsin mi? Bu iÅŸlem geri alÄ±namaz.')) return
    setLoading(true)
    setMsg(null)
    setErr(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadıÄ±')
      const res = await fetch(`${base}/api/home`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Silme başarısız')
      setMsg('Silindi')
      setJsonText(JSON.stringify(SAMPLE, null, 2))
    } catch (e: any) {
      setErr(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = () => {
    setJsonText(JSON.stringify(SAMPLE, null, 2))
    setMsg('Åablon Yüklendi')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">HomeData Yönetimi</h1>
          <a href="/admin/home/form" className="text-sm underline">Form düzenleyiciye geç</a>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <button onClick={refresh} disabled={loading} className="px-3 py-1 border rounded disabled:opacity-50">Yönetimile</button>
          <button onClick={loadTemplate} disabled={loading} className="px-3 py-1 border rounded disabled:opacity-50">Åablon</button>
          <button onClick={upsert} disabled={loading} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50">Kaydet/Upsert</button>
          <button onClick={removeAll} disabled={loading} className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50">Sil</button>
        </div>
      </div>
      {(msg || err) && (
        <p className={err ? 'text-red-500 text-sm' : 'text-green-500 text-sm'}>{err || msg}</p>
      )}
      <div>
        <label className="block text-sm mb-2">HomeData (JSON)</label>
        <textarea
          className="w-full min-h-[420px] border rounded p-3 font-mono text-sm bg-transparent"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  )
}

function getToken(): string | null {
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}



