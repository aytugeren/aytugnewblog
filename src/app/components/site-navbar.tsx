import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          AytuğY<span className="text-primary">.dev</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/blog" className="text-sm hover:underline">Blog</Link>
          <Link href="/projects" className="text-sm hover:underline">Projeler</Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

