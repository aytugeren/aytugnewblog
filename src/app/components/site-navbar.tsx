"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

export function SiteNavbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
      setIsAdmin(!!m);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          {"Aytu\u011FY"}<span className="text-primary">.dev</span>
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
