import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  type P = { slug: string; date: string; published?: boolean };
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
  } catch { /* ignore */ }

  const postEntries: MetadataRoute.Sitemap = list.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.date,
  }));

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    { url: `${base}/projects`, lastModified: new Date() },
    ...postEntries,
  ];
}
