import { allPosts } from ".contentlayer/generated";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavbar } from "../../components/site-navbar";
import { Mdx } from "../../components/mdx";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const post = allPosts.find(p => p.slug === slug);
  if (!post){
    const res = await fetch(`${apiUrl}/api/posts/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const p = await res.json();
      return { title: p.title, description: p.summary };
    }
  }
  else{
    return { title: post.title, description: post.summary };
  }
      
  return { title: slug};
}

export default async function PostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = allPosts.find(p => p.slug === slug);
  if (!post) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    try {
      const res = await fetch(`${apiUrl}/api/posts/${slug}`, { cache: "no-store" });
      if (res.ok) {
        const p = await res.json();
        const date = typeof p.date === 'string' ? p.date : '';
        const publishedAt = date ? new Date(date) : null;
        const formatted = publishedAt && !isNaN(publishedAt.valueOf())
          ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(publishedAt)
          : null;
        const tags: string[] = Array.isArray(p.tags) ? p.tags : [];
        return (
          <>
            <SiteNavbar />
            <article className="prose mx-auto max-w-3xl px-4 py-12">
              <header className="mb-6">
                <h1 className="mb-2">{p.title}</h1>
                <div className="text-sm text-gray-500">
                  {formatted}
                  {tags.length ? (
                    <>
                      {" • "}
                      {tags.map((t: string, i: number) => (
                        <span key={t}>#{t}{i < tags.length - 1 ? ", " : null}</span>
                      ))}
                    </>
                  ) : null}
                </div>
                {p.summary ? <p className="mt-2 text-gray-600">{p.summary}</p> : null}
              </header>
              {p.body ? (
                <div dangerouslySetInnerHTML={{ __html: p.body }} />
              ) : (
                <p className="text-muted-foreground">Bu yazı API üzerinden yüklendi. İçerik mevcut değil.</p>
              )}
            </article>
          </>
        );
      }
    } catch { /* ignore */ }
    return notFound();
  }

  function normalizePostDate(input: unknown): Date | null {
    if (!input) return null;
    if (input instanceof Date && !isNaN(input.valueOf())) return input;
    if (typeof input === "string") {
      const iso = input.replace(/\r/g, "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
      return new Date(`${iso}T00:00:00Z`);
    }
    return null;
  }

  const publishedAt = normalizePostDate(post.date);
  const formatted = publishedAt
    ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "UTC" }).format(publishedAt)
    : "Tarih yok";
  const tags = post.tags ?? [];

  return (
    <>
      <SiteNavbar />
      <article className="prose mx-auto max-w-3xl px-4 py-12">
        <header className="mb-6">
          <h1 className="mb-2">{post.title}</h1>
          <div className="text-sm text-gray-500">
            {formatted}
            {tags.length ? (
              <>
                {" • "}
                {tags.map((t, i) => (
                  <span key={t}>#{t}{i < tags.length - 1 ? ", " : null}</span>
                ))}
              </>
            ) : null}
          </div>
          {post.summary ? <p className="mt-2 text-gray-600">{post.summary}</p> : null}
        </header>
        <Mdx code={post.body.code} />
      </article>
    </>
  );
}

export async function generateStaticParams() {
  return allPosts.map(p => ({ slug: p.slug }));
}

