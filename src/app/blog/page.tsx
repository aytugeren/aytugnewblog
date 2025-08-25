"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { allPosts } from ".contentlayer/generated"; // veya "contentlayer/generated"
import { SiteNavbar } from "../components/site-navbar";

export default function BlogList() {
  const [q, setQ] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const posts = useMemo(() => {
    const base = allPosts
      .filter(p => p.published !== false)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const term = q.trim().toLowerCase();

    return base.filter(p => {
      const tagMatch = selectedTag
        ? (p.tags ?? []).map(t => t.toLowerCase()).includes(selectedTag.toLowerCase())
        : true;

      const textMatch = term
        ? p.title.toLowerCase().includes(term) ||
          (p.summary ?? "").toLowerCase().includes(term) ||
          (p.tags ?? []).some(t => t.toLowerCase().includes(term))
        : true;

      return tagMatch && textMatch;
    });
  }, [q, selectedTag]);

  const clearFilters = () => {
    setQ("");
    setSelectedTag(null);
  };

  // Tüm etiketlerin ufak bir bulutu (opsiyonel)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of allPosts) (p.tags ?? []).forEach(t => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, []);

  return (
    <>
      <SiteNavbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Blog</h1>

        {/* Arama + aktif filtreler */}
        <div className="mt-4 flex flex-col gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: başlık, özet veya etiket..."
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            aria-label="Blogda ara"
          />

          {/* Aktif etiket filtresi */}
          {selectedTag && (
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-full border px-2 py-1 text-xs">#{selectedTag}</span>
              <button
                className="text-xs underline"
                onClick={() => setSelectedTag(null)}
                aria-label="Etiket filtresini temizle"
              >
                etiketi kaldır
              </button>
            </div>
          )}

          {/* Etiket bulutu (opsiyonel) */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full border px-2 py-1 text-xs ${
                    selectedTag?.toLowerCase() === tag.toLowerCase()
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  }`}
                  aria-label={`#${tag} etiketine filtrele`}
                >
                  #{tag}
                </button>
              ))}
              {(q || selectedTag) && (
                <button onClick={clearFilters} className="text-xs underline ml-auto">
                  tüm filtreleri temizle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Liste */}
        <ul className="mt-6 space-y-5">
          {posts.map((p) => (
            <li key={p.slug} className="group">
              <Link
                href={`/blog/${p.slug}`}
                className="text-lg font-medium group-hover:underline"
              >
                {p.title}
              </Link>
              <div className="text-sm text-gray-500">{p.summary}</div>

              {p.tags?.length ? (
                <div className="mt-1 text-xs text-gray-400">
                  {p.tags.map((t) => (
                    <button
                      key={t}
                      onClick={(e) => { e.preventDefault(); setSelectedTag(t); }}
                      className="mr-2 underline-offset-2 hover:underline"
                      aria-label={`#${t} etiketine filtrele`}
                    >
                      #{t}
                    </button>
                  ))}
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
