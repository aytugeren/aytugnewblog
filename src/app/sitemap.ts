import { allPosts } from ".contentlayer/generated"; // veya "contentlayer/generated"
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://senin-domainin.com"; // 👉 burayı kendi domaininle değiştir

  const posts = allPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.date,
  }));

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    ...posts,
  ];
}
