import { SiteNavbar } from "../components/site-navbar";
import { Section } from "@/components/section";
import { ProjectCard } from "@/components/project-card";
import { apiFetch } from '@/services/api';

type RawProject = {
  projectName?: string;
  projectTechnologies?: string | string[];
  productDescription?: string;
  projectLink?: string;
  // legacy fallbacks
  title?: string;
  Title?: string;
  summary?: string;
  Summary?: string;
  tags?: string[];
  Tags?: string[];
  link?: string;
  url?: string;
  href?: string;
};

function normalizeProject(p: RawProject) {
  const legacyTitle = (p as any).title ?? (p as any).Title;
  const legacySummary = (p as any).summary ?? (p as any).Summary;
  const legacyTags = (p as any).tags ?? (p as any).Tags;

  const title = (p.projectName ?? legacyTitle ?? "").toString();
  const summary = (p.productDescription ?? legacySummary ?? "").toString();
  const href = (p.projectLink ?? (p as any).link ?? (p as any).url ?? (p as any).href ?? "").toString().trim();

  let tags: string[] = [];
  if (Array.isArray(p.projectTechnologies)) {
    tags = p.projectTechnologies.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof p.projectTechnologies === "string") {
    tags = p.projectTechnologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  } else if (Array.isArray(legacyTags)) {
    tags = legacyTags.map((t: any) => String(t).trim()).filter(Boolean);
  }

  return { title, summary, tags, href };
}

export default async function ProjectsPage() {
  let rawProjects: RawProject[] = [];
  try {
    const res = await apiFetch('/api/home');
    if (res.ok) {
      const data = await res.json();
      rawProjects = Array.isArray(data?.projects) ? data.projects : [];
    }
  } catch {
    // ignore; show empty state
  }

  const projects = rawProjects.map(normalizeProject);

  return (
    <>
      <SiteNavbar />
      <main>
        <Section title="Projeler" description="Çalışmalarımdan seçilmiş projeler">
          {projects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, idx) => (
                <ProjectCard key={idx} title={p.title} summary={p.summary} tags={p.tags} href={p.href} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Şimdilik proje bulunamadı.</p>
          )}
        </Section>
      </main>
    </>
  );
}
