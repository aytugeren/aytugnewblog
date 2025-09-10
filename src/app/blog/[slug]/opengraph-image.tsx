import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

  let title = "Yazı bulunamadı";
  let summary = "";
  let dateStr = "";
  try {
    const res = await fetch(`${apiUrl}/api/posts/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const p = await res.json();
      title = p.title ?? title;
      summary = p.summary ?? "";
      dateStr = p.date ?? "";
    }
  } catch { /* ignore */ }

  return new ImageResponse(
    (
      <div
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(135deg, #0B1220 0%, #111827 40%, #1f2937 100%)",
          color: "#fff",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              width: 14, height: 14, borderRadius: 9999, background: "#8b5cf6",
              boxShadow: "0 0 20px rgba(139,92,246,0.7)",
            }}
          />
          <div style={{ fontSize: 28, opacity: 0.9 }}>Aytuğ.dev • Blog</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          {summary ? (
            <div
              style={{
                fontSize: 28,
                opacity: 0.85,
                maxWidth: 950,
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {summary}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 24, opacity: 0.8 }}>{dateStr}</div>
          <div
            style={{
              fontSize: 24,
              padding: "10px 16px",
              borderRadius: 12,
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.45)",
            }}
          >
            nextjs • api • tailwind
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

