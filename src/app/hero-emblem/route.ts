export const dynamic = 'force-dynamic'

export async function GET() {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL as string) || ''
  const url = `${apiBase.replace(/\/$/, '')}/api/files/hero-emblem`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    return new Response('Not Found', { status: 404 })
  }
  const buf = await res.arrayBuffer()
  const ct = res.headers.get('content-type') || 'application/octet-stream'
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

