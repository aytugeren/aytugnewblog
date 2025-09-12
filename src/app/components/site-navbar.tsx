"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

export function SiteNavbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [brand, setBrand] = useState<string>("AytugY.dev");

  useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
      setIsAdmin(!!m);
    } catch {
      setIsAdmin(false);
    }

    // Fetch site settings to get siteName for navbar brand
    (async () => {
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL as string) || "";
        const res = await fetch(`${base.replace(/\/$/, "")}/api/settings`, { cache: "no-store" });
        if (res.ok) {
          const s = await res.json();
          const name = (s?.siteName as string | undefined) || "";
          const title = (s?.defaultTitle as string | undefined) || "";
          const chosen = name || title;
          if (chosen) setBrand(chosen);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          {brand.endsWith('.dev') ? (
            <>
              {brand.slice(0, -4)}<span className="text-primary">.dev</span>
            </>
          ) : (
            brand
          )}
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/blog" className="text-sm hover:underline">Blog</Link>
          <Link href="/projects" className="text-sm hover:underline">Projeler</Link>
          <ThemeToggle />
          {isAdmin && (
            <Link href="/admin" className="text-sm rounded border px-3 py-1 hover:bg-muted">
              Admin
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
