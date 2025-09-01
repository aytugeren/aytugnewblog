import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { SiteNavbar } from "./components/site-navbar";
import { Section } from "@/components/section";
import { SkillBar } from "@/components/skill-bar";
import { TimelineItem } from "@/components/timeline-item";
import { ProjectCard } from "@/components/project-card";
import { PostListItem } from "@/components/post-list-item";
import { Entrance3D } from "@/components/entrance-3d";
import { CodeBackground } from "./components/codebackground";
import { CornerCoder } from "@/components/corner-coder";

const labelOngoingTitle = "\u00DCzerinde \u00C7al\u0131\u015Ft\u0131\u011F\u0131m Projeler";
const labelOngoingDesc = "Tamamlanma y\u00FCzdesi ile g\u00FCncel durum";
const labelNoProject = "\u015Eu an payla\u015F\u0131lan bir proje yok.";
const labelExperienceTitle = "Deneyim Zaman \u00C7izelgesi";
const labelSelectedProjectsTitle = "Se\u00E7ili Projeler";

export default async function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  let errorMessage: string | null = null;

  type Experience = {
    companyName: string;
    tag: string;
    beginDate: string;
    endDate: string;
    workDescription: string;
  };
  type Project = {
    projectName: string;
    projectTechnologies?: string | string[];
    productDescription: string;
    projectLink?: string | null;
  };
  type OngoingProject = { name: string; percent: number };
  type Post = { title: string; date: string; summary: string; slug: string; tags?: string[] };

  let data: {
    skills: Record<string, { name: string; level: string }[]>;
    experiences: Experience[];
    projects: Project[];
    posts?: Post[];
    hasCv?: boolean;
    ongoingProjects?: OngoingProject[];
    heroTitle?: string;
    heroSubtitle?: string;
  } = { skills: {}, experiences: [], projects: [], posts: [], hasCv: false, ongoingProjects: [] };

  let postsFromApi: Post[] = [];
  try {
    const [homeRes, postsRes] = await Promise.all([
      fetch(`${apiUrl}/api/home`, { cache: "no-store" }),
      fetch(`${apiUrl}/api/posts`, { cache: "no-store" })
    ]);
    if (homeRes.ok) data = await homeRes.json();
    if (postsRes.ok) postsFromApi = await postsRes.json();
  } catch (err) {
    console.error("Failed to fetch data", err);
    errorMessage = "Failed to load data. Showing default content.";
  }

  const skills = data.skills ?? {};
  const experiences = data.experiences ?? [];
  const projects = data.projects ?? [];
  const posts = (Array.isArray(postsFromApi) && postsFromApi.length > 0) ? postsFromApi : (data.posts ?? []);
  const hasCv = data.hasCv ?? false;
  const ongoingProjects = data.ongoingProjects ?? [];
  const heroTitle = (data.heroTitle as any) ?? "Aytu\u011F Y \u2014 Senior .NET & Frontend Engineer";
  const heroSubtitle = (data.heroSubtitle as any) ?? "Y\u00FCksek etkili \u00FCr\u00FCnler in\u015Fa eden, performans odakl\u0131 bir geli\u015Ftirici. Tak\u0131mlar\u0131n h\u0131zl\u0131 ve g\u00FCvenilir \u015Fekilde teslimat yapmas\u0131n\u0131 sa\u011Flar.";

  return (
    <>
      <CodeBackground />
      <SiteNavbar />
      {errorMessage && (
        <p className="mx-auto max-w-6xl rounded-md bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">{errorMessage}</p>
      )}
      <Entrance3D>
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent" aria-hidden />
          <main>
            {/* Hero */}
            <section className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
              <div className="grid items-center gap-12 md:grid-cols-2">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{heroTitle}</h1>
                  <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">{heroSubtitle}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="#contact" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">{"\u0130leti\u015Fim"}</Link>
                    <Link href="#projects" className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">Projeler</Link>
                    {hasCv ? (
                      <a href="/cv.pdf" download className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">CV'yi indir (PDF)</a>
                    ) : (
                      <button className="inline-flex items-center rounded-md border border-input bg-muted px-4 py-2 text-sm font-medium text-muted-foreground" disabled>CV'yi indir (PDF)</button>
                    )}
                  </div>
                  <div className="mt-8 flex gap-4">
                    <Link href="https://github.com/aytug" aria-label="GitHub" className="text-muted-foreground transition hover:text-foreground"><Github className="h-5 w-5" /></Link>
                    <Link href="https://linkedin.com/in/aytug" aria-label="LinkedIn" className="text-muted-foreground transition hover:text-foreground"><Linkedin className="h-5 w-5" /></Link>
                    <Link href="https://x.com/aytug" aria-label="X" className="text-muted-foreground transition hover:text-foreground"><Twitter className="h-5 w-5" /></Link>
                  </div>
                </div>
                <div className="flex justify-center md:justify-end">
                  <Image src="/vercel.svg" width={160} height={160} alt={"Aytu\u011F Y avatar"} className="h-40 w-40 rounded-full bg-primary/10 p-4" />
                </div>
              </div>
            </section>

            {/* Ongoing Projects */}
            <Section title={labelOngoingTitle} description={labelOngoingDesc}>
              {ongoingProjects.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {ongoingProjects.map((p, idx) => {
                    const pct = Math.max(0, Math.min(100, Number((p as any).percent ?? (p as any).Percent) || 0));
                    const name = (p as any).name ?? (p as any).Name ?? "Proje";
                    return (
                      <div key={idx} className="rounded-2xl border bg-card p-6 shadow-sm">
                        <div className="mb-3 text-sm font-medium">{name}</div>
                        <div className="space-y-2">
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-primary" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right text-xs text-muted-foreground">{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{labelNoProject}</p>
              )}
            </Section>

            {/* Skills */}
            <Section title="Yetenekler">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(skills).map(([category, items]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="font-semibold">{category}</h3>
                    <div className="space-y-3">
                      {items.map((skill) => (
                        <SkillBar key={skill.name} name={skill.name} level={skill.level} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Experience */}
            <Section title={labelExperienceTitle}>
              <ol className="space-y-8">
                {experiences.map((exp, key) => {
                  const period = `${exp.beginDate}${exp.endDate ? " – " + exp.endDate : " – Günümüz"}`;
                  return (
                    <TimelineItem key={key} company={exp.companyName} role={exp.tag} period={period} achievements={exp.workDescription ? [exp.workDescription] : []} />
                  );
                })}
              </ol>
            </Section>

            {/* Selected Projects */}
            <Section id="projects" title={labelSelectedProjectsTitle}>
              <div className="grid gap-6 sm:grid-cols-2">
                {projects.map((proj, idx) => {
                  const legacyTitle = (proj as any).title ?? (proj as any).Title;
                  const legacySummary = (proj as any).summary ?? (proj as any).Summary;
                  const legacyTags = (proj as any).tags ?? (proj as any).Tags;
                  const legacyLink = (proj as any).projectLink ?? (proj as any).link ?? (proj as any).url ?? (proj as any).href;

                  const name = (proj.projectName as any) || legacyTitle || "";
                  const summary = (proj.productDescription as any) || legacySummary || "";
                  const tags = Array.isArray(proj.projectTechnologies)
                    ? (proj.projectTechnologies as string[])
                    : String((proj.projectTechnologies as any) ?? "").split(",").map((t) => t.trim()).filter(Boolean);

                  return (
                    <ProjectCard key={idx} title={name} summary={summary} tags={tags as any} href={legacyLink as any} />
                  );
                })}
              </div>
            </Section>

            {/* Latest Posts */}
            <Section title="Son Blog Yazıları">
              <div className="space-y-8">
                {posts.map((post) => (
                  <PostListItem key={post.slug} post={post} />
                ))}
              </div>
            </Section>

            {/* Contact */}
            <Section id="contact" title={"\u0130leti\u015Fim"}>
              <div className="space-y-6">
                <a href="mailto:aytug@example.com" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">Email Gönder</a>
                <form className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium leading-none">Ad</label>
                    <input id="name" type="text" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium leading-none">E-posta</label>
                    <input id="email" type="email" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm font-medium leading-none">Mesaj</label>
                    <textarea id="message" rows={4} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="button" disabled className="inline-flex items-center rounded-md border border-input bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">Gönder</button>
                  </div>
                </form>
              </div>
            </Section>
          </main>
        </div>
      </Entrance3D>
      <CornerCoder />
    </>
  );
}
