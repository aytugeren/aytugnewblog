import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavbar } from "../../components/site-navbar";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL as string;
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL as string)?.replace(/\/$/, "") || "";
  try {
    const res = await fetch(`${apiUrl}/api/posts/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const p = await res.json();
      const title = p?.title ?? slug;
      const description = p?.summary ?? "";
      const pageUrl = `${siteBase}/blog/${slug}`;
      const image = `${siteBase}/blog/${slug}/opengraph-image`;
      const tags: string[] = Array.isArray(p?.tags) ? p.tags : [];
      return {
        title,
        description,
        alternates: { canonical: `/blog/${slug}` },
        openGraph: {
          type: "article",
          url: pageUrl,
          siteName: "Aytug Eren",
          title,
          description,
          images: [image],
          locale: "tr_TR",
          publishedTime: typeof p?.date === "string" ? p.date : undefined,
          authors: ["Aytug Eren"],
          tags,
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [image],
        },
      };
    }
  } catch { /* ignore */ }
  return {
    title: slug,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function PostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL as string;
  try {
    const res = await fetch(`${apiBase}/api/posts/${slug}`, { cache: "no-store" });
    if (!res.ok) return notFound();
    const p = await res.json();
    const date = typeof p.date === 'string' ? p.date : '';
    const publishedAt = date ? new Date(date) : null;
    const formatted = publishedAt && !isNaN(publishedAt.valueOf())
      ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "UTC" }).format(publishedAt)
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
                  {" - "}
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
  } catch {
    return notFound();
  }
}

// No static params; routes resolve via API only
