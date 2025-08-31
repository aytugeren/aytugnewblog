"use client";
import { SkillBadge } from "./skill-badge";

interface ProjectCardProps {
  title?: string | null;
  summary?: string | null;
  tags?: string[];
  href?: string;
}

export function ProjectCard({ title, summary, tags, href }: ProjectCardProps) {
  const safeTitle = (title ?? "").trim() || "Proje";
  const safeSummary = (summary ?? "").trim();
  const safeTags = Array.isArray(tags) ? tags : [];
  const to = href?.trim();

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md">
      <h3 className="text-lg font-semibold">{safeTitle}</h3>
      {safeSummary && (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{safeSummary}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {safeTags.map((tag) => (
          <SkillBadge key={tag}>{tag}</SkillBadge>
        ))}
      </div>
      {to ? (
        <a
          href={to}
          onClick={(e) => {
            e.preventDefault();
            const url = to;
            if (!url) return;
            // Emit global event for modal opener
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("open-project-iframe", { detail: { url, title: safeTitle } })
              );
            }
          }}
          className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
          aria-label={`${safeTitle} detayları`}
        >
          Detay »
        </a>
      ) : null}
    </div>
  );
}
