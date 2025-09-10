export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL as string).replace(/\/$/, "");

  type P = { title: string; date: string; summary?: string; slug: string; tags?: string[]; published?: boolean };

  let list: P[] = [];
  try {
    const res = await fetch(`${apiBase}/api/posts`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        list = (data as P[])
          .filter((p) => p.published !== false)
          .sort((a, b) => +new Date(a.date) < +new Date(b.date) ? 1 : -1);
      }
    }
  } catch {
    // ignore
  }

  const items = list
    .map(
      (p) => `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${siteBase}/blog/${p.slug}</link>
        <pubDate>${new Date(p.date).toUTCString()}</pubDate>
        ${p.summary ? `<description><![CDATA[${p.summary}]]></description>` : ""}
      </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Aytuğ Y — Blog</title>
      <link>${siteBase}</link>
      <description>Aytuğ'un blog yazıları</description>
      ${items}
    </channel>
  </rss>`;

  return new Response(rss, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
