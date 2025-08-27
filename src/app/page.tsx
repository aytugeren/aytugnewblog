import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { SiteNavbar } from "./components/site-navbar";
import { Section } from "@/components/section";
import { SkillBadge } from "@/components/skill-badge";
import { TimelineItem } from "@/components/timeline-item";
import { ProjectCard } from "@/components/project-card";
import { PostListItem } from "@/components/post-list-item";

export default async function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  let errorMessage: string | null = null;
  type Experience = {
    company: string;
    role: string;
    period: string;
    achievements: string[];
  };
  type Project = {
    title: string;
    summary: string;
    tags: string[];
    href: string;
  };
  type Post = {
    title: string;
    date: string;
    summary: string;
    slug: string;
  };

  let data: {
    highlights: string[];
    skills: Record<string, { name: string; level: string }[]>;
    experiences: Experience[];
    projects: Project[];
    posts: Post[];
    hasCv: boolean;
  } = {
    highlights: [],
    skills: {},
    experiences: [],
    projects: [],
    posts: [],
    hasCv: false,
  };

  try {
    const res = await fetch(`${apiUrl}/api/home`, { cache: "no-store" });
    data = await res.json();
  } catch (error) {
    console.error("Failed to fetch home data", error);
    errorMessage = "Failed to load data. Showing default content.";
  }

  const { highlights, skills, experiences, projects, posts, hasCv } = data;

  return (
    <>
      <SiteNavbar />
      {errorMessage && (
        <p className="mx-auto max-w-6xl rounded-md bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent"
          aria-hidden
        />
        <main>
          {/* Hero */}
          <section className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Aytuğ — Senior .NET &amp; Frontend Engineer
                </h1>
                <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">
                  Yüksek etkili ürünler inşa eden, performans odaklı bir geliştirici.
                  Takımların hızlı ve güvenilir şekilde teslimat yapmasını sağlar.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="#contact"
                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    İletişim
                  </Link>
                  <Link
                    href="#projects"
                    className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Projeler
                  </Link>
                    {hasCv ? (
                    <a
                      href="/cv.pdf"
                      download
                      className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      CV&apos;yi indir (PDF)
                    </a>
                  ) : (
                    <button
                      className="inline-flex items-center rounded-md border border-input bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
                      disabled
                    >
                      CV&apos;yi indir (PDF)
                    </button>
                  )}
                </div>
                <div className="mt-8 flex gap-4">
                  <Link
                    href="https://github.com/aytug"
                    aria-label="GitHub"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    <Github className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://linkedin.com/in/aytug"
                    aria-label="LinkedIn"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    <Linkedin className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://x.com/aytug"
                    aria-label="X"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    <Twitter className="h-5 w-5" />
                  </Link>
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                <Image
                  src="/vercel.svg"
                  width={160}
                  height={160}
                  alt="Aytuğ avatar"
                  className="h-40 w-40 rounded-full bg-primary/10 p-4"
                />
              </div>
            </div>
          </section>

          {/* Highlights */}
          <Section title="Hızlı Öne Çıkanlar">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border bg-card p-6 text-center shadow-sm"
                >
                  <p className="font-medium">{item}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Skills Matrix */}
          <Section title="Skills Matrix">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(skills).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-semibold">{category}</h3>
                  <ul className="mt-4 space-y-2">
                    {items.map((skill) => (
                      <li
                        key={skill.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{skill.name}</span>
                        <SkillBadge>{skill.level}</SkillBadge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* Experience Timeline */}
          <Section title="Deneyim Zaman Çizelgesi">
            <ol className="space-y-8">
              {experiences.map((exp) => (
                <TimelineItem key={exp.company} {...exp} />
              ))}
            </ol>
          </Section>

          {/* Selected Projects */}
          <Section id="projects" title="Seçili Projeler">
            <div className="grid gap-6 sm:grid-cols-2">
              {projects.map((proj) => (
                <ProjectCard key={proj.title} {...proj} />
              ))}
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
          <Section id="contact" title="İletişim">
            <div className="space-y-6">
              <a
                href="mailto:aytug@example.com"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Email Gönder
              </a>
              <form className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium leading-none"
                  >
                    Ad
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-none"
                  >
                    E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium leading-none"
                  >
                    Mesaj
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center rounded-md border border-input bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
                  >
                    Gönder
                  </button>
                </div>
              </form>
            </div>
          </Section>
        </main>
      </div>
    </>
  );
}
