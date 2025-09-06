"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteNavbar } from "../components/site-navbar";

export default function BlogList() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const [q, setQ] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [apiPosts, setApiPosts] = useState<Array<{ title: string; date: string; summary: string; slug: string; tags?: string[] }>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/posts`, { cache: "no-store" });
          console.log("Fetched API posts:", res);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data)) {
            // data items expected: { title, date, summary, slug } or include id
            setApiPosts(
              data.map((p: any) => ({
                title: String(p.title ?? ""),
                date: String(p.date ?? ""),
                summary: String(p.summary ?? ""),
                slug: String(p.slug ?? ""),
                tags: Array.isArray(p.tags) ? p.tags.map((t: any) => String(t)) : [],
              }))
            );
          }
        }
      } catch (e: any) {
        if (!ignore) setLoadError(e?.message ?? "API error");
      }
    })();
    return () => {
      ignore = true;
    };
  }, [apiUrl]);

  const posts = useMemo(() => {
    const base = apiPosts
      .map((p) => ({ ...p, tags: Array.isArray(p.tags) ? p.tags : [] as string[] }))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const term = q.trim().toLowerCase();
    return base.filter((p) => {
      const tagMatch = selectedTag
        ? (p.tags ?? []).map((t) => t.toLowerCase()).includes(selectedTag.toLowerCase())
        : true;
      const textMatch = term
        ? p.title.toLowerCase().includes(term) ||
          (p.summary ?? "").toLowerCase().includes(term) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(term))
        : true;
      return tagMatch && textMatch;
    });
  }, [q, selectedTag, apiPosts]);

  const clearFilters = () => {
    setQ("");
    setSelectedTag(null);
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of apiPosts) (p.tags ?? []).forEach((t) => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [apiPosts]);

  return (
    <>
      <SiteNavbar />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
            <p className="mt-1 text-sm text-muted-foreground">Yazılar, notlar ve teknik paylaşımlar</p>
          </div>
          <div className="w-full sm:w-80">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ara: başlık, özet veya etiket..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
              aria-label="Blogda ara"
            />
          </div>
        </header>

        {allTags.length > 0 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto py-1 text-xs">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`whitespace-nowrap rounded-full border px-2 py-1 transition ${
                  selectedTag?.toLowerCase() === tag.toLowerCase()
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
                aria-label={`#${tag} etiketine filtrele`}
              >
                #{tag}
              </button>
            ))}
            {(q || selectedTag) && (
              <button onClick={clearFilters} className="ml-auto underline">
                Filtreleri temizle
              </button>
            )}
          </div>
        )}

        {(selectedTag || loadError) && (
          <p className="mb-4 text-sm">
            {selectedTag && (
              <>Etiket: <span className="rounded-full border px-2 py-1 text-xs">#{selectedTag}</span></>
            )}
            {loadError && (
              <span className="ml-2 text-destructive">(API: {loadError})</span>
            )}
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((p) => {
            const d = new Date(p.date);
            const formatted = isNaN(d.valueOf())
              ? ""
              : new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "UTC" }).format(d);
            return (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-lg font-semibold group-hover:underline">{p.title}</h3>
                {formatted && (
                  <time className="mt-1 block text-xs text-muted-foreground">{formatted}</time>
                )}
                {p.summary && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.summary}</p>
                )}
                {p.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTag(t);
                        }}
                        className="cursor-pointer rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                  Devamı →
                </span>
              </Link>
            );
          })}
        </div>

        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">Sonuç bulunamadı.</p>
        )}
      </main>
    </>
  );
}
