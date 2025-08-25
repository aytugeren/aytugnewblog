import { allPosts } from "contentlayer/generated"; // gerekirse ".contentlayer/generated"
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavbar } from "../../components/site-navbar";
import { Mdx } from "../../components/mdx";

// build-time: hangi slug'lar üretilecek?
export async function generateStaticParams() {
  return allPosts.map(p => ({ slug: p.slug }));
}

// SEO başlık/açıklama
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = allPosts.find(p => p.slug === params.slug);
  if (!post) return { title: "Yazı bulunamadı" };
  return { title: post.title, description: post.summary };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = allPosts.find(p => p.slug === params.slug);
  if (!post) return notFound();

  return (
    <>
      <SiteNavbar />
      <article className="prose mx-auto max-w-3xl px-4 py-12">
        <h1>{post.title}</h1>
        {/* tarih / etiketler istersen burada */}
        <Mdx code={post.body.code} />
      </article>
    </>
  );
}
