"use client";

import { ReactNode, useEffect, useState } from "react";

interface Entrance3DProps {
  children: ReactNode;
  durationMs?: number;
}

export function Entrance3D({ children, durationMs = 700 }: Entrance3DProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setEntered(true);
      return;
    }
    // Lock scroll and ensure we start at the top to avoid auto-scrolling during entrance
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const tEnter = setTimeout(() => setEntered(true), 20);
    const tUnlock = setTimeout(() => {
      document.documentElement.style.overflow = prevHtmlOverflow || "";
      document.body.style.overflow = prevBodyOverflow || "";
    }, durationMs + 50);

    return () => {
      clearTimeout(tEnter);
      clearTimeout(tUnlock);
      document.documentElement.style.overflow = prevHtmlOverflow || "";
      document.body.style.overflow = prevBodyOverflow || "";
    };
  }, [durationMs]);

  const style = entered
    ? {
        transform: "none",
        opacity: 1,
        transition: `transform ${durationMs}ms ease-out, opacity ${durationMs}ms ease-out`,
        transformOrigin: "top center",
      }
    : {
        transform: "perspective(1000px) translateZ(-80px) rotateX(6deg) scale(0.98)",
        opacity: 0,
        transformOrigin: "top center",
      };

  return (
    <div style={style} className="will-change-transform">
      {children}
    </div>
  );
}
