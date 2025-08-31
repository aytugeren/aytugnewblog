import Link from "next/link";

interface Post {
  title: string;
  date: string;
  summary: string;
  slug: string;
  tags?: string[];
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
      {post.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              #{t}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
