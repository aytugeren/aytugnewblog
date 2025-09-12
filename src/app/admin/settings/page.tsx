"use client"
import { useEffect, useMemo, useState } from 'react'

type Settings = {
  siteName?: string
  defaultTitle?: string
  titleTemplate?: string
  description?: string
  keywords: string[]
  twitterCreator?: string
  locale?: string
  siteUrl?: string
  defaultOgImage?: string
}

const DEFAULT_SETTINGS: Settings = {
  siteName: 'Aytug Eren',
  defaultTitle: 'Aytug Eren - Blog',
  titleTemplate: '%s - Aytug Eren',
  description: 'Senior developer showcase + blog',
  keywords: ['Aytug Eren', 'Senior Developer', '.NET', 'Frontend', 'Blog'],
  twitterCreator: '@aytug',
  locale: 'tr_TR',
  siteUrl: '',
  defaultOgImage: '',
}

export default function AdminSettingsPage() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL as string
  const [data, setData] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const snapshot = useMemo(() => JSON.stringify(data), [data])
  const [saved, setSaved] = useState<string>(snapshot)
  const isDirty = snapshot !== saved

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setErr(null)
      setMsg(null)
      try {
        const res = await fetch(`${base}/api/settings`, { cache: 'no-store' })
        if (res.status === 404) {
          setData(DEFAULT_SETTINGS)
          setSaved(JSON.stringify(DEFAULT_SETTINGS))
        } else if (!res.ok) {
          throw new Error('Ayarlar yüklenemedi')
        } else {
          const j = await res.json()
          const d: Settings = {
            siteName: j?.siteName ?? '',
            defaultTitle: j?.defaultTitle ?? '',
            titleTemplate: j?.titleTemplate ?? '',
            description: j?.description ?? '',
            keywords: Array.isArray(j?.keywords) ? j.keywords : [],
            twitterCreator: j?.twitterCreator ?? '',
            locale: j?.locale ?? 'tr_TR',
            siteUrl: j?.siteUrl ?? '',
            defaultOgImage: j?.defaultOgImage ?? '',
          }
          setData(d)
          setSaved(JSON.stringify(d))
        }
      } catch (e: any) {
        setErr(e.message || 'Hata')
      } finally {
        setLoading(false)
      }
    })()
  }, [base])

  const save = async () => {
    setLoading(true)
    setErr(null)
    setMsg(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const res = await fetch(`${base}/api/settings/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Kaydetme başarısız')
      setSaved(JSON.stringify(data))
      setMsg('Ayarlar kaydedildi')
    } catch (e: any) {
      setErr(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Site Ayarları</h1>
        <div className="flex items-center gap-3">
          {isDirty && <span className="text-xs text-amber-600">Kaydedilmemiş değişiklikler var</span>}
          <button
            onClick={save}
            disabled={loading}
            className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
          >Kaydet</button>
        </div>
      </div>
      {(msg || err) && (
        <p className={err ? 'text-red-500 text-sm' : 'text-green-600 text-sm'}>{err || msg}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Site Adı">
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.siteName || ''}
            onChange={e => setData({ ...data, siteName: e.target.value })} />
        </Field>
        <Field label="Varsayılan Başlık">
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.defaultTitle || ''}
            onChange={e => setData({ ...data, defaultTitle: e.target.value })} />
        </Field>
        <Field label={'Başlık Şablonu (%s)'}>
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.titleTemplate || ''}
            onChange={e => setData({ ...data, titleTemplate: e.target.value })} />
        </Field>
        <Field label="Açıklama">
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.description || ''}
            onChange={e => setData({ ...data, description: e.target.value })} />
        </Field>
        <Field label="Anahtar Kelimeler (virgülle)">
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.keywords.join(', ')}
            onChange={e => setData({ ...data, keywords: splitKeywords(e.target.value) })} />
        </Field>
        <Field label="Twitter Creator">
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.twitterCreator || ''}
            onChange={e => setData({ ...data, twitterCreator: e.target.value })} />
        </Field>
        <Field label="Locale">
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.locale || ''}
            onChange={e => setData({ ...data, locale: e.target.value })} />
        </Field>
        <Field label="Site URL">
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.siteUrl || ''}
            onChange={e => setData({ ...data, siteUrl: e.target.value })} />
        </Field>
        <Field label="Varsayılan OG Görsel (URL)">
          <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.defaultOgImage || ''}
            onChange={e => setData({ ...data, defaultOgImage: e.target.value })} />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function splitKeywords(s: string): string[] {
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

function getToken(): string | null {
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

