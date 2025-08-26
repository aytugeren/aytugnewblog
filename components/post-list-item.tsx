import Link from "next/link";

interface Post {
  title: string;
  date: string;
  summary: string;
  slug: string;
}

export function PostListItem({ post }: { post: Post }) {
  const formatted = new Date(post.date).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <article className="space-y-2">
      <h3 className="text-lg font-semibold">
        <Link href={`/blog/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h3>
      <time className="block text-sm text-muted-foreground">{formatted}</time>
      <p className="text-sm text-muted-foreground leading-relaxed">{post.summary}</p>
    </article>
  );
}
