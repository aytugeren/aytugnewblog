"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { allPosts } from ".contentlayer/generated"; // veya "contentlayer/generated"
import { SiteNavbar } from "../components/site-navbar";

export default function BlogList() {
  const [q, setQ] = useState("");

  const posts = useMemo(() => {
    const base = allPosts
      .filter(p => p.published !== false)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    if (!q.trim()) return base;

    const term = q.toLowerCase();
    return base.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.summary?.toLowerCase().includes(term) ||
      (p.tags ?? []).some(t => t.toLowerCase().includes(term))
    );
  }, [q]);

  return (
    <>
      <SiteNavbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Blog</h1>

        {/* Arama kutusu */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ara: başlık, özet veya etiket..."
          className="mt-4 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
          aria-label="Blogda ara"
        />

        <ul className="mt-6 space-y-5">
          {posts.map(p => (
            <li key={p.slug} className="group">
              <Link href={`/blog/${p.slug}`} className="text-lg font-medium group-hover:underline">
                {p.title}
              </Link>
              <div className="text-sm text-gray-500">{p.summary}</div>
              {p.tags?.length ? (
                <div className="mt-1 text-xs text-gray-400">
                  {p.tags.map(t => <span key={t} className="mr-2">#{t}</span>)}
                </div>
              ) : null}
            </li>
          ))}
          {posts.length === 0 && (
            <li className="text-sm text-gray-500">Sonuç bulunamadı.</li>
          )}
        </ul>
      </main>
    </>
  );
}
