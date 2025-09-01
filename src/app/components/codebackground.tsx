"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const snippets = [
  `public class Product {
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public decimal Price { get; set; }
}`,
  `app.MapGet("/api/products", async (AppDb db) =>
    await db.Products.ToListAsync());`,
  `builder.Services.AddDbContext<AppDb>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));`,
  `public record Order(int Id, DateTime CreatedAt, decimal Total);`,
];

export function CodeBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const currentSnippet = snippets[snippetIndex];
    if (charIndex < currentSnippet.length) {
      const timer = setTimeout(() => {
        setText((t) => t + currentSnippet[charIndex]);
        setCharIndex((i) => i + 1);
      }, 40);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setSnippetIndex((i) => (i + 1) % snippets.length);
        setText("");
        setCharIndex(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [charIndex, snippetIndex]);

  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";
  if (!isDark) return null;

  return (
    <div
      aria-hidden
      className="
        fixed inset-0 z-[-1]
        pointer-events-none
        flex items-center justify-center
        overflow-hidden
        bg-gradient-to-b from-[#0B1220] to-black
      "
    >
      <pre className="whitespace-pre-wrap text-foreground/15 text-sm max-w-4xl">
        {text}
        <span className="animate-pulse">|</span>
      </pre>
    </div>
  );
}
