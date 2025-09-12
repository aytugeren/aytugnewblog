"use client";
import { Instagram, Linkedin, Github } from "lucide-react";

export function SocialLinks({
  instagram,
  linkedin,
  github,
}: {
  instagram: string;
  linkedin: string;
  github: string;
}) {
  const open = (url: string, title: string) => {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      // Common platforms that disallow being embedded in iframes
      const blocks = new Set([
        "instagram.com",
        "www.instagram.com",
        "linkedin.com",
        "www.linkedin.com",
        "github.com",
        "www.github.com",
        "x.com",
        "www.x.com",
        "twitter.com",
        "www.twitter.com",
      ]);
      if (blocks.has(host)) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      window.dispatchEvent(
        new CustomEvent("open-project-iframe", { detail: { url, title } })
      );
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };
  return (
    <div className="mt-8 flex gap-4"> 
      <button
        type="button"
        aria-label="Instagram"
        title="Instagram"
        className="text-muted-foreground transition hover:text-foreground"
        onClick={() => open(instagram, "Instagram")}
      >
        <Instagram className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="LinkedIn"
        title="LinkedIn"
        className="text-muted-foreground transition hover:text-foreground"
        onClick={() => open(linkedin, "LinkedIn")}
      >
        <Linkedin className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="GitHub"
        title="GitHub"
        className="text-muted-foreground transition hover:text-foreground"
        onClick={() => open(github, "GitHub")}
      >
        <Github className="h-5 w-5" />
      </button>
    </div>
  );
}
