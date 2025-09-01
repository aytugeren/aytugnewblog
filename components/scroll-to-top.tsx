"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const click = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  return (
    <button
      aria-label="Yukarı çık"
      onClick={click}
      className={`fixed bottom-5 right-5 z-[60] rounded-full shadow-lg border bg-primary text-primary-foreground transition-opacity duration-300 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <span className="sr-only">Yukarı çık</span>
      <ArrowUp className="h-5 w-5 m-3" />
    </button>
  );
}
