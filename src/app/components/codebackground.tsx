"use client";
import { useEffect, useState } from "react";

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
  const [text, setText] = useState("");
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentSnippet = snippets[snippetIndex];
    if (charIndex < currentSnippet.length) {
      const timer = setTimeout(() => {
        setText((t) => t + currentSnippet[charIndex]);
        setCharIndex((i) => i + 1);
      }, 40); // yazma hızı (ms)
      return () => clearTimeout(timer);
    } else {
      // bitince 1 sn bekle, sonra yeni snippet'e geç
      const timer = setTimeout(() => {
        setSnippetIndex((i) => (i + 1) % snippets.length);
        setText("");
        setCharIndex(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [charIndex, snippetIndex]);

  return (
    <div
      aria-hidden
      className="
        fixed inset-0 z-[-1]
        pointer-events-none
        flex items-center justify-center
        overflow-hidden
        bg-gradient-to-b from-gray-900 to-black
      "
    >
      <pre className="whitespace-pre-wrap text-gray-400/15 text-sm max-w-4xl">
        {text}
        <span className="animate-pulse">|</span>
      </pre>
    </div>
  );
}
