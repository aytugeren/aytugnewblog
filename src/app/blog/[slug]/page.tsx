import { allPosts } from ".contentlayer/generated"; // veya "contentlayer/generated"
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavbar } from "../../components/site-navbar";
import { Mdx } from "../../components/mdx";

// ✅ params Promise oldu + await
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;           // <-- await
  const post = allPosts.find(p => p.slug === slug);
  if (!post) return { title: "Yazı bulunamadı" };
  return { title: post.title, description: post.summary };
}

// ✅ params Promise oldu + await
export default async function PostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;           // <-- await
  const post = allPosts.find(p => p.slug === slug);
  if (!post) return notFound();

// post bulunduğu yerde, formatlamadan hemen önce ekle:
function normalizePostDate(input: unknown): Date | null {
  if (!input) return null;
  // 1) Date nesnesi geldiyse
  if (input instanceof Date && !isNaN(input.valueOf())) return input;
  // 2) String geldiyse: \r temizle, sadece YYYY-MM-DD al
  if (typeof input === "string") {
    const iso = input.replace(/\r/g, "").trim();         // "2025-08-25"
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;    // beklenen format değilse geçersiz
    return new Date(`${iso}T00:00:00Z`);                  // UTC'ye sabitle
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
                {" · "}
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

// (opsiyonel) build-time static params aynı kalabilir:
export async function generateStaticParams() {
  return allPosts.map(p => ({ slug: p.slug }));
}
