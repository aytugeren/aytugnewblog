import Link from "next/link";
import { SkillBadge } from "./skill-badge";

interface ProjectCardProps {
  title: string;
  summary: string;
  tags: string[];
  href: string;
}

export function ProjectCard({ title, summary, tags, href }: ProjectCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <SkillBadge key={tag}>{tag}</SkillBadge>
        ))}
      </div>
      <Link
        href={href}
        className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
        aria-label={`${title} detayları`}
      >
        Detay →
      </Link>
    </div>
  );
}
