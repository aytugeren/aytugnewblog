"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

type AnimTo = "light" | "dark" | null;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [animTo, setAnimTo] = useState<AnimTo>(null);

  const isDark = (resolvedTheme ?? theme) === "dark";

  useEffect(() => setMounted(true), []);

  const click = () => {
    const next: AnimTo = isDark ? "light" : "dark";
    setAnimTo(next);
    setTheme(next);
    setTimeout(() => setAnimTo(null), 1400);
  };

  if (!mounted) return null;

  return (
    <button
      aria-label="Temay\u0131 de\u011Fi\u015Ftir"
      className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
      onClick={click}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {animTo && <div className="theme-transition-overlay" data-to={animTo} />}
    </button>
  );
}




