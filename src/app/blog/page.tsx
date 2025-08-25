import { allPosts } from "contentlayer/generated";
import Link from "next/link";
import { SiteNavbar } from "../components/site-navbar";

export default function BlogList() {
  const posts = allPosts
    .filter(p => p.published)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <>
      <SiteNavbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Blog</h1>
        <ul className="mt-6 space-y-5">
          {posts.map(p => (
            <li key={p.slug} className="group">
              <Link href={`/blog/${p.slug}`} className="text-lg font-medium group-hover:underline">
                {p.title}
              </Link>
              <div className="text-sm text-muted-foreground">{p.summary}</div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}