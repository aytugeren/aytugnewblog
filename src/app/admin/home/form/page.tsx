"use client"
import { useEffect, useMemo, useState } from 'react'

type Skill = { Name: string; Level: string }
type Experience = { CompanyName: string; Tag: string; BeginDate: string; EndDate: string; WorkDescription: string }
type Project = { ProjectName: string; ProjectTechnologies: string; ProductDescription: string; ProjectLink?: string | null }
type Ongoing = { Name: string; Percent: number }

type HomeData = {
  HeroTitle?: string
  HeroSubtitle?: string
  HeroEmblem?: string
  Skills: Record<string, Skill[]>
  Experiences: Experience[]
  Projects: Project[]
  Posts: any[]
  HasCv: boolean
  OngoingProjects: Ongoing[]
}

const DEFAULT_DATA: HomeData = {
  HeroTitle: "Aytu\u011F Y \u2014 Senior .NET & Frontend Engineer",
  HeroSubtitle:
    "Y\u00FCksek etkili \u00FCr\u00FCnler in\u015Fa eden, performans odakl\u0131 bir geli\u015Ftirici. Tak\u0131mlar\u0131n h\u0131zl\u0131 ve g\u00FCvenilir \u015Fekilde teslimat yapmas\u0131n\u0131 sa\u011Flar.",
  HeroEmblem: '',
  Skills: {},
  Experiences: [],
  Projects: [],
  Posts: [],
  HasCv: false,
  OngoingProjects: [],
}

export default function AdminHomeFormPage() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL as string
  const [data, setData] = useState<HomeData>(DEFAULT_DATA)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [emblemFile, setEmblemFile] = useState<File | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<string>(
    JSON.stringify(toApiPayload(DEFAULT_DATA))
  )

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(toApiPayload(data)) !== savedSnapshot
    } catch {
      return true
    }
  }, [data, savedSnapshot])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setMsg(null)
      setErr(null)
      try {
        const res = await fetch(`${base}/api/home`)
        if (res.status === 404) {
          setData(DEFAULT_DATA)
          setSavedSnapshot(JSON.stringify(toApiPayload(DEFAULT_DATA)))
          setMsg('Yeni HomeData oluşturabilirsiniz.')
        } else if (!res.ok) {
          throw new Error('HomeData yüklenemedi')
        } else {
          const d = await res.json()
          const norm = normalizeFromApi(d)
          setData(norm)
          setSavedSnapshot(JSON.stringify(toApiPayload(norm)))
        }
      } catch (e: any) {
        setErr(e.message || 'Hata')
      } finally {
        setLoading(false)
      }
    })()
  }, [base])

  // Warn user before leaving when there are unsaved changes
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = 'Değişiklikleriniz kaybolacaktır.'
    }
    window.addEventListener('beforeunload', beforeUnload)

    const clickCapture = (e: MouseEvent) => {
      if (!isDirty) return
      const target = e.target as HTMLElement | null
      if (!target) return
      const anchor = target.closest('a') as HTMLAnchorElement | null
      if (!anchor) return
      if (
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        (e as MouseEvent & { metaKey?: boolean }).metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return
      const href = anchor.getAttribute('href')
      if (!href) return
      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.href === window.location.href) return
      const ok = window.confirm(
        'Değişiklikleriniz kaybolacaktır. Yine de devam edilsin mi?'
      )
      if (!ok) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('click', clickCapture, true)

    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', clickCapture, true)
    }
  }, [isDirty])

  const saveAll = async () => {
    setLoading(true)
    setMsg(null)
    setErr(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const res = await fetch(`${base}/api/home/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(toApiPayload(data)),
      })
      if (!res.ok) throw new Error('Kaydetme başarısız')
      setMsg('Kaydedildi')
      setSavedSnapshot(JSON.stringify(toApiPayload(data)))
    } catch (e: any) {
      setErr(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  const uploadCv = async () => {
    if (!cvFile) {
      setErr('PDF dosyası seçin')
      return
    }
    setLoading(true)
    setMsg(null)
    setErr(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const fd = new FormData()
      fd.append('file', cvFile)
      const res = await fetch(`${base}/api/upload/cv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) throw new Error('CV yüklenemedi')
      setMsg('CV yüklendi')
      setData((d) => {
        const nd = { ...d, HasCv: true }
        setSavedSnapshot(JSON.stringify(toApiPayload(nd)))
        return nd
      })
    } catch (e: any) {
      setErr(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  const downloadCv = async () => {
    try {
      setErr(null)
      setMsg(null)
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL as string
        await fetch(`${base}/api/track/cv`, { method: 'POST' })
      } catch {}
      const res = await fetch('/cv.pdf', { cache: 'no-store' })
      if (!res.ok) throw new Error('CV bulunamadı')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cv.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMsg('CV indirildi')
    } catch (e: any) {
      setErr(e.message || 'İndirme hatası')
    }
  }

  const uploadEmblem = async () => {
    if (!emblemFile) {
      setErr('Görsel dosyası seçin')
      return
    }
    setLoading(true)
    setMsg(null)
    setErr(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Oturum bulunamadı')
      const fd = new FormData()
      fd.append('file', emblemFile)
      const res = await fetch(`${base}/api/upload/hero-emblem`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) throw new Error('Amblem yüklenemedi')
      const j = await res.json()
      const url = String(j?.url || '')
      setData((d) => {
        const nd = { ...d, HeroEmblem: url }
        setSavedSnapshot(JSON.stringify(toApiPayload(nd)))
        return nd
      })
      setMsg('Amblem yüklendi')
    } catch (e: any) {
      setErr(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">HomeData (Form)</h1>
          <a href="/admin/home" className="text-sm underline">JSON düzenleyiciye geç</a>
        </div>
        <div className="flex gap-2 items-center">
          {isDirty && (
            <span className="text-xs text-amber-600">Kaydedilmemiş değişiklikler var</span>
          )}
          <button
            disabled={loading}
            onClick={saveAll}
            className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            Tümünü Kaydet
          </button>
        </div>
      </div>
      {(msg || err) && (
        <p className={err ? 'text-red-500 text-sm' : 'text-green-500 text-sm'}>
          {err || msg}
        </p>
      )}

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Ana Ekran Başlık & Açıklama</h2>
        <div className="space-y-2">
          <input
            className="w-full border rounded px-2 py-1 bg-transparent"
            placeholder="Başlık"
            value={data.HeroTitle || ''}
            onChange={(e) => setData((d) => ({ ...d, HeroTitle: e.target.value }))}
          />
          <textarea
            className="w-full border rounded px-2 py-1 bg-transparent min-h-[80px]"
            placeholder="Açıklama"
            value={data.HeroSubtitle || ''}
            onChange={(e) => setData((d) => ({ ...d, HeroSubtitle: e.target.value }))}
          />
          <input
            className="w-full border rounded px-2 py-1 bg-transparent"
            placeholder="Amblem (emoji veya metin)"
            value={data.HeroEmblem || ''}
            onChange={(e) => setData((d) => ({ ...d, HeroEmblem: e.target.value }))}
          />
        </div>
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Amblem Yükleme</h2>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Hero amblemi (PNG/JPG/WebP/SVG)</div>
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={(e) => setEmblemFile(e.target.files?.[0] ?? null)} />
            <button
              type="button"
              onClick={uploadEmblem}
              disabled={loading || !emblemFile}
              className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
            >
              Yükle
            </button>
            {data.HeroEmblem && (data.HeroEmblem.startsWith('http') || data.HeroEmblem.startsWith('/')) && (
              <img src={data.HeroEmblem} alt="Hero emblem" className="h-7 w-7 object-contain rounded" />
            )}
          </div>
          <p className="text-xs text-gray-500">Kaydedilen dosya, {`/hero-emblem`} üzerinden sunulur.</p>
        </div>
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Genel</h2>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.HasCv}
              onChange={(e) => setData({ ...data, HasCv: e.target.checked })}
            />
            <span>CV mevcut</span>
          </label>
          {data.HasCv && (
            <>
              <a href="/cv.pdf" target="_blank" className="text-sm underline">
                CV'yi görüntüle
              </a>
              <button type="button" onClick={downloadCv} className="text-sm px-2 py-1 border rounded">
                İndir
              </button>
            </>
          )}
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">CV Yükle (PDF)</div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={uploadCv}
              disabled={loading || !cvFile}
              className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
            >
              Yükle
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Dosya, site kökündeki <code>/cv.pdf</code> olarak kaydedilir.
          </p>
        </div>
      </section>

      <SkillsEditor value={data.Skills} onChange={(Skills) => setData({ ...data, Skills })} />

      <ExperiencesEditor
        value={data.Experiences}
        onChange={(Experiences) => setData({ ...data, Experiences })}
      />

      <ProjectsEditor value={data.Projects} onChange={(Projects) => setData({ ...data, Projects })} />

      <OngoingEditor
        value={data.OngoingProjects}
        onChange={(OngoingProjects) => setData({ ...data, OngoingProjects })}
      />
    </div>
  )
}

function SkillsEditor({
  value,
  onChange,
}: {
  value: Record<string, Skill[]>
  onChange: (v: Record<string, Skill[]>) => void
}) {
  const [newCat, setNewCat] = useState('')
  const addCategory = () => {
    const name = newCat.trim()
    if (!name || value[name]) return
    onChange({ ...value, [name]: [] })
    setNewCat('')
  }
  const removeCategory = (key: string) => {
    const { [key]: _, ...rest } = value
    onChange(rest)
  }
  const addSkill = (key: string) => {
    onChange({ ...value, [key]: [...(value[key] || []), { Name: '', Level: '50' }] })
  }
  const updateSkill = (key: string, idx: number, patch: Partial<Skill>) => {
    const arr = [...(value[key] || [])]
    arr[idx] = { ...arr[idx], ...patch }
    onChange({ ...value, [key]: arr })
  }
  const removeSkill = (key: string, idx: number) => {
    const arr = [...(value[key] || [])]
    arr.splice(idx, 1)
    onChange({ ...value, [key]: arr })
  }
  const renameCategory = (oldKey: string, newKey: string) => {
    const nk = newKey.trim()
    if (!nk || nk === oldKey) return
    const entries = Object.entries(value).map(([k, v]) => (k === oldKey ? [nk, v] : [k, v])) as [
      string,
      Skill[]
    ][]
    onChange(Object.fromEntries(entries))
  }
  return (
    <section className="border rounded p-4 space-y-3">
      <h2 className="font-semibold">Yetenekler</h2>
      <div className="flex gap-2">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Kategori adı (örn. Languages)"
          className="border rounded px-2 py-1 flex-1 bg-transparent"
        />
        <button type="button" onClick={addCategory} className="px-3 py-1 border rounded">
          Kategori Ekle
        </button>
      </div>
      <div className="space-y-4">
        {Object.entries(value).map(([key, list]) => (
          <div key={key} className="border rounded p-3 space-y-3">
            <div className="flex items-center gap-2">
              <input
                defaultValue={key}
                onBlur={(e) => renameCategory(key, e.target.value)}
                className="border rounded px-2 py-1 bg-transparent font-semibold"
              />
              <button onClick={() => addSkill(key)} className="text-sm px-2 py-1 border rounded">
                Skill Ekle
              </button>
              <button
                onClick={() => removeCategory(key)}
                className="text-sm px-2 py-1 border rounded text-red-600"
              >
                Kategori Sil
              </button>
            </div>
            <div className="space-y-2">
              {list.map((s, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <input
                    value={s.Name}
                    onChange={(e) => updateSkill(key, i, { Name: e.target.value })}
                    placeholder="Ad"
                    className="col-span-2 border rounded px-2 py-1 bg-transparent"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={toNum(s.Level)}
                    onChange={(e) =>
                      updateSkill(key, i, { Level: clamp0to100(Number(e.target.value)).toString() })
                    }
                    className="border rounded px-2 py-1 bg-transparent"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={toNum(s.Level)}
                    onChange={(e) =>
                      updateSkill(key, i, { Level: clamp0to100(Number(e.target.value)).toString() })
                    }
                  />
                  <button
                    onClick={() => removeSkill(key, i)}
                    className="text-sm px-2 py-1 border rounded text-red-600"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(value).length === 0 && (
          <p className="text-sm text-gray-500">Henüz kategori yok. Bir kategori ekleyin.</p>
        )}
      </div>
    </section>
  )
}

function ExperiencesEditor({ value, onChange }: { value: Experience[]; onChange: (v: Experience[]) => void }) {
  const add = () =>
    onChange([...(value || []), { CompanyName: '', Tag: '', BeginDate: '', EndDate: '', WorkDescription: '' }])
  const update = (i: number, patch: Partial<Experience>) => {
    const arr = [...value]
    arr[i] = { ...arr[i], ...patch }
    onChange(arr)
  }
  const remove = (i: number) => {
    const arr = [...value]
    arr.splice(i, 1)
    onChange(arr)
  }
  return (
    <section className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Deneyimler</h2>
        <button onClick={add} className="px-3 py-1 border rounded">
          Ekle
        </button>
      </div>
      <div className="space-y-3">
        {value.map((e, i) => (
          <div key={i} className="border rounded p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Şirket"
                value={e.CompanyName}
                onChange={(ev) => update(i, { CompanyName: ev.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Etiket (örn. Fullstack)"
                value={e.Tag}
                onChange={(ev) => update(i, { Tag: ev.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Başlangıç (YYYY-MM)"
                value={e.BeginDate}
                onChange={(ev) => update(i, { BeginDate: ev.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Bitiş (YYYY-MM / Devam)"
                value={e.EndDate}
                onChange={(ev) => update(i, { EndDate: ev.target.value })}
              />
            </div>
            <textarea
              className="w-full border rounded px-2 py-1 bg-transparent"
              placeholder="Açıklama"
              value={e.WorkDescription}
              onChange={(ev) => update(i, { WorkDescription: ev.target.value })}
            />
            <div className="text-right">
              <button onClick={() => remove(i)} className="text-sm px-2 py-1 border rounded text-red-600">
                Sil
              </button>
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-sm text-gray-500">Henüz deneyim eklenmedi.</p>
        )}
      </div>
    </section>
  )
}

function ProjectsEditor({ value, onChange }: { value: Project[]; onChange: (v: Project[]) => void }) {
  const add = () =>
    onChange([...(value || []), { ProjectName: '', ProjectTechnologies: '', ProductDescription: '', ProjectLink: '' }])
  const update = (i: number, patch: Partial<Project>) => {
    const arr = [...value]
    arr[i] = { ...arr[i], ...patch }
    onChange(arr)
  }
  const remove = (i: number) => {
    const arr = [...value]
    arr.splice(i, 1)
    onChange(arr)
  }
  return (
    <section className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Projeler</h2>
        <button onClick={add} className="px-3 py-1 border rounded">
          Ekle
        </button>
      </div>
      <div className="space-y-3">
        {value.map((p, i) => (
          <div key={i} className="border rounded p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Proje Adı"
                value={p.ProjectName}
                onChange={(ev) => update(i, { ProjectName: ev.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Teknolojiler"
                value={p.ProjectTechnologies}
                onChange={(ev) => update(i, { ProjectTechnologies: ev.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Bağlantı (opsiyonel)"
                value={p.ProjectLink ?? ''}
                onChange={(ev) => update(i, { ProjectLink: ev.target.value })}
              />
            </div>
            <textarea
              className="w-full border rounded px-2 py-1 bg-transparent"
              placeholder="Açıklama"
              value={p.ProductDescription}
              onChange={(ev) => update(i, { ProductDescription: ev.target.value })}
            />
            <div className="text-right">
              <button onClick={() => remove(i)} className="text-sm px-2 py-1 border rounded text-red-600">
                Sil
              </button>
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-sm text-gray-500">Henüz proje eklenmedi.</p>
        )}
      </div>
    </section>
  )
}

function OngoingEditor({ value, onChange }: { value: Ongoing[]; onChange: (v: Ongoing[]) => void }) {
  const add = () => onChange([...(value || []), { Name: '', Percent: 0 }])
  const update = (i: number, patch: Partial<Ongoing>) => {
    const arr = [...value]
    arr[i] = { ...arr[i], ...patch }
    onChange(arr)
  }
  const remove = (i: number) => {
    const arr = [...value]
    arr.splice(i, 1)
    onChange(arr)
  }
  return (
    <section className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Devam Eden Projeler</h2>
        <button onClick={add} className="px-3 py-1 border rounded">
          Ekle
        </button>
      </div>
      <div className="space-y-3">
        {value.map((o, i) => (
          <div key={i} className="border rounded p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 items-center">
              <input
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Ad"
                value={o.Name}
                onChange={(ev) => update(i, { Name: ev.target.value })}
              />
              <input
                type="number"
                min={0}
                max={100}
                className="border rounded px-2 py-1 bg-transparent"
                placeholder="Yüzde"
                value={o.Percent}
                onChange={(ev) => update(i, { Percent: clamp0to100(Number(ev.target.value)) })}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={o.Percent}
                onChange={(ev) => update(i, { Percent: clamp0to100(Number(ev.target.value)) })}
              />
            </div>
            <div className="text-right">
              <button onClick={() => remove(i)} className="text-sm px-2 py-1 border rounded text-red-600">
                Sil
              </button>
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-sm text-gray-500">Henüz öğe eklenmedi.</p>
        )}
      </div>
    </section>
  )
}

function clamp0to100(n: number) {
  return Math.max(0, Math.min(100, isFinite(n) ? n : 0))
}

function getToken(): string | null {
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

function toNum(v: string | number | undefined | null): number {
  if (typeof v === 'number') return clamp0to100(v)
  const n = parseInt(String(v ?? 0), 10)
  return clamp0to100(isNaN(n) ? 0 : n)
}

function normalizeFromApi(api: any): HomeData {
  const skills: Record<string, Skill[]> = {}
  if (api?.skills && typeof api.skills === 'object') {
    for (const [cat, list] of Object.entries(api.skills as Record<string, any[]>)) {
      skills[cat] = (Array.isArray(list) ? list : []).map((s: any) => ({
        Name: s?.name ?? s?.Name ?? '',
        Level: String(s?.level ?? s?.Level ?? '0'),
      }))
    }
  }

  const experiences = Array.isArray(api?.experiences)
    ? api.experiences.map((e: any) => ({
        CompanyName: e?.companyName ?? e?.CompanyName ?? '',
        Tag: e?.tag ?? e?.Tag ?? '',
        BeginDate: e?.beginDate ?? e?.BeginDate ?? '',
        EndDate: e?.endDate ?? e?.EndDate ?? '',
        WorkDescription: e?.workDescription ?? e?.WorkDescription ?? '',
      }))
    : []

  const projects = Array.isArray(api?.projects)
    ? api.projects.map((p: any) => ({
        ProjectName: p?.projectName ?? p?.ProjectName ?? p?.title ?? p?.Title ?? '',
        ProjectTechnologies:
          p?.projectTechnologies ??
          p?.ProjectTechnologies ??
          (Array.isArray(p?.tags) ? p.tags.join(', ') : p?.tags ?? ''),
        ProductDescription: p?.productDescription ?? p?.ProductDescription ?? p?.summary ?? p?.Summary ?? '',
        ProjectLink: p?.projectLink ?? p?.ProjectLink ?? p?.link ?? p?.url ?? p?.href ?? null,
      }))
    : []

  const ongoing = Array.isArray(api?.ongoingProjects)
    ? api.ongoingProjects.map((o: any) => ({
        Name: o?.name ?? o?.Name ?? '',
        Percent: toNum(o?.percent ?? o?.Percent),
      }))
    : []

  return {
    HeroTitle: String(api?.heroTitle ?? api?.HeroTitle ?? ''),
    HeroSubtitle: String(api?.heroSubtitle ?? api?.HeroSubtitle ?? ''),
    HeroEmblem: String(api?.heroEmblem ?? api?.HeroEmblem ?? ''),
    Skills: skills,
    Experiences: experiences,
    Projects: projects,
    Posts: [],
    HasCv: Boolean(api?.hasCv ?? api?.HasCv ?? false),
    OngoingProjects: ongoing,
  }
}

function toApiPayload(data: HomeData) {
  const skills = Object.fromEntries(
    Object.entries(data.Skills).map(([cat, list]) => [cat, list.map((s) => ({ name: s.Name, level: s.Level }))])
  )
  return {
    skills,
    experiences: data.Experiences.map((e) => ({
      companyName: e.CompanyName,
      tag: e.Tag,
      beginDate: e.BeginDate,
      endDate: e.EndDate,
      workDescription: e.WorkDescription,
    })),
    projects: data.Projects.map((p) => ({
      projectName: p.ProjectName,
      projectTechnologies: p.ProjectTechnologies,
      productDescription: p.ProductDescription,
      projectLink: p.ProjectLink ?? null,
    })),
    posts: [],
    hasCv: data.HasCv,
    heroTitle: data.HeroTitle ?? '',
    heroSubtitle: data.HeroSubtitle ?? '',
    heroEmblem: data.HeroEmblem ?? '',
    ongoingProjects: data.OngoingProjects.map((o) => ({ name: o.Name, percent: o.Percent })),
  }
}
