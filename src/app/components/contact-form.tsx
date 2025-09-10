"use client"
import { useState } from 'react'

export function ContactForm() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL as string
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [hp, setHp] = useState('') // honeypot, must stay empty
  const [ts, setTs] = useState<number>(() => Math.floor(Date.now() / 1000))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOk(null)
    try {
      if (!name.trim() || !email.trim() || !message.trim()) {
        throw new Error('Lütfen tüm alanları doldurun')
      }
      const res = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), hp, ts }),
      })
      if (res.status === 429) throw new Error('Çok fazla deneme. Lütfen daha sonra tekrar deneyin.')
      if (!res.ok) throw new Error('Gönderilemedi')
      setOk('Mesajınız alındı. Teşekkürler!')
      setName('')
      setEmail('')
      setMessage('')
      setTs(Math.floor(Date.now() / 1000))
    } catch (e: any) {
      setError(e.message || 'Hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" autoComplete="off">
      <div className="sm:col-span-2">
        {(error || ok) && (
          <p className={error ? 'text-red-500 text-sm' : 'text-green-600 text-sm'}>{error || ok}</p>
        )}
      </div>
      {/* Honeypot field: keep hidden from real users */}
      <div className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium leading-none">Ad</label>
        <input id="name" type="text" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-none">E-posta</label>
        <input id="email" type="email" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="block text-sm font-medium leading-none">Mesaj</label>
        <textarea id="message" rows={4} maxLength={2000} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={loading} className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50">
          {loading ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </div>
    </form>
  )
}
