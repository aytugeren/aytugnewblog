import type { NextRequest } from 'next/server'

export const revalidate = 0

async function checkEndpoint(url: string) {
  const started = Date.now()
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const ms = Date.now() - started
    const text = await res.text()
    const size = text.length
    const encodingWarnings: string[] = []
    if (/Ã|Å|Ä|Â|�/.test(text)) encodingWarnings.push('encoding_mojibake')
    if (/[\uFFFD]/.test(text)) encodingWarnings.push('replacement_char')
    return {
      url,
      ok: res.ok,
      status: res.status,
      ms,
      size,
      encodingWarnings,
    }
  } catch (e: any) {
    const ms = Date.now() - started
    return { url, ok: false, status: 0, ms, size: 0, error: String(e) }
  }
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const targets = ['/', '/blog', '/projects', '/rss.xml']
  const absolute = targets.map((t) => new URL(t, origin).toString())

  const results = await Promise.all(absolute.map(checkEndpoint))

  const avgMs = Math.round(
    results.reduce((a, b) => a + (typeof b.ms === 'number' ? b.ms : 0), 0) / results.length
  )
  const hasErrors = results.some((r) => !r.ok)
  const anyEncoding = results.some((r: any) => Array.isArray(r.encodingWarnings) && r.encodingWarnings.length)

  let aiSummary: string | null = null
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
  if (apiKey) {
    const prompt = `You are a site reliability assistant. Summarize the following health checks in Turkish for a nontechnical admin. Mention any endpoints with errors, slow responses (>800ms), and encoding problems. End with a short priority list.\n\nChecks JSON:\n${JSON.stringify({ origin, results, avgMs, hasErrors, anyEncoding }).slice(0, 15000)}`
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a concise SRE assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 200,
        }),
      })
      if (r.ok) {
        const j: any = await r.json()
        aiSummary = j.choices?.[0]?.message?.content ?? null
      } else {
        aiSummary = null
      }
    } catch {
      aiSummary = null
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      origin,
      checkedAt: new Date().toISOString(),
      avgMs,
      hasErrors,
      anyEncoding,
      results,
      aiSummary,
    }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  )
}
