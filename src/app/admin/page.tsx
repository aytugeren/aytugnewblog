"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Me = { name: string; roles: string[] }
type Stats = { projects: number; posts: number; visitors: number; cvDownloads: number }

export default function AdminDashboard() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
    // me
    fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error('Yetkilendirme başarısız')
        const d = (await r.json()) as Me
        setMe(d)
      })
      .catch((e) => setError(e.message))
    // stats
    fetch(`${base}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) return
        const s = (await r.json()) as Stats
        setStats(s)
      })
      .catch(() => {})
  }, [])

  const logout = () => {
    document.cookie = `token=; Path=/; Max-Age=0`
    router.replace('/admin/login')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{"Yönetim Paneli"}</h1>
        <button onClick={logout} className="text-sm px-3 py-1 rounded border">{"Çıkış Yap"}</button>
      </div>
      {me && (
        <p className="text-sm text-gray-400">{"Hoş geldin"}, {me.name}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Projeler" value={stats.projects} />
          <StatCard label="Postlar" value={stats.posts} />
          <StatCard label={"Ziyaretçiler"} value={stats.visitors} />
          <StatCard label={"CV İndirme"} value={stats.cvDownloads} />
        </div>
      )}
    </div>
  )
}

function getToken(): string | null {
  const match = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-4 bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}
