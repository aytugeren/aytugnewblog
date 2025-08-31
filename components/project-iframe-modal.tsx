"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type OpenEvent = CustomEvent<{ url: string; title?: string }>;

function isSafeUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProjectIframeModal() {
  const [url, setUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");

  const close = useCallback(() => {
    setUrl(null);
    setTitle("");
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as OpenEvent;
      const next = ce.detail?.url;
      if (next && isSafeUrl(next)) {
        setUrl(next);
        setTitle(ce.detail?.title ?? "Proje");
      }
    };
    window.addEventListener("open-project-iframe", handler as EventListener);
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", escHandler);
    return () => {
      window.removeEventListener("open-project-iframe", handler as EventListener);
      window.removeEventListener("keydown", escHandler);
    };
  }, [close]);

  // Compute derived values via hooks before any conditional return
  const src = url ?? "";
  const host = useMemo(() => {
    try {
      return new URL(src).host;
    } catch {
      return "";
    }
  }, [src]);

  const visible = url !== null;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={close}
        aria-hidden
      />
      <div className="absolute inset-4 md:inset-10 rounded-xl overflow-hidden shadow-2xl border bg-background flex flex-col">
        <header className="flex items-center justify-between border-b px-4 py-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium">{title}</h3>
            <p className="truncate text-xs text-muted-foreground">{host}</p>
          </div>
          <button
            onClick={close}
            className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
            aria-label="Kapat"
          >
            Kapat
          </button>
        </header>
        <div className="flex-1 bg-neutral-900/5 dark:bg-neutral-50/5">
          <iframe
            title={title || "Proje"}
            src={src}
            className="h-full w-full"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
          />
        </div>
      </div>
    </div>
  );
}
