"use client"
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const next = sp.get('next') || '/admin'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        throw new Error('Giriş başarısız')
      }
      const data = await res.json()
      const token: string | undefined = data.token
      if (!token) throw new Error('Token alınamadı')
      // Store token in a cookie accessible by middleware
      const maxAgeDays = 7
      document.cookie = `token=${token}; Path=/; Max-Age=${maxAgeDays * 24 * 60 * 60}`
      router.replace(next)
    } catch (err: any) {
      setError(err?.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded p-6 bg-white/5">
        <h1 className="text-xl font-semibold">{"Yönetim Paneli Girişi"}</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="block text-sm">{"Kullanıcı Adı"}</label>
          <input
            className="w-full border rounded px-3 py-2 bg-transparent"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm">Parola</label>
          <input
            className="w-full border rounded px-3 py-2 bg-transparent"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2"
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
        </button>
      </form>
    </div>
  )
}
