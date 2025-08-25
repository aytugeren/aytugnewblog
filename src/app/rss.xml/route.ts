import { allPosts } from ".contentlayer/generated"; // veya "contentlayer/generated"

export async function GET() {
  const base = "https://senin-domainin.com"; // 👉 burayı kendi domaininle değiştir

  const items = allPosts
    .filter((p) => p.published !== false)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .map((p) => `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${base}/blog/${p.slug}</link>
        <pubDate>${new Date(p.date).toUTCString()}</pubDate>
        <description><![CDATA[${p.summary}]]></description>
      </item>
    `)
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>Blog RSS</title>
      <link>${base}</link>
      <description>Aytuğ'un blog yazıları</description>
      ${items}
    </channel>
  </rss>`;

  return new Response(rss, {
    headers: { "Content-Type": "application/xml" },
  });
}
