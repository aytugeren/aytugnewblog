import fs from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { allPosts } from "contentlayer/generated";
import { SiteNavbar } from "./components/site-navbar";
import { Section } from "@/components/section";
import { SkillBadge } from "@/components/skill-badge";
import { TimelineItem } from "@/components/timeline-item";
import { ProjectCard } from "@/components/project-card";
import { PostListItem } from "@/components/post-list-item";

export default function HomePage() {
  const posts = allPosts
    .filter((p) => p.published !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const hasCV = fs.existsSync(path.join(process.cwd(), "public", "cv.pdf"));

  const highlights = [
    "10+ yıl tecrübe",
    ".NET 9 + Next.js",
    "Elasticsearch & PostgreSQL",
    "Bulut & CI/CD",
  ];

  const skills = {
    Backend: [
      { name: ".NET", level: "İleri" },
      { name: "EF Core", level: "İleri" },
      { name: "PostgreSQL", level: "İleri" },
      { name: "Redis", level: "Orta" },
    ],
    Frontend: [
      { name: "Next.js", level: "İleri" },
      { name: "TypeScript", level: "İleri" },
      { name: "Tailwind", level: "İleri" },
      { name: "shadcn/ui", level: "Orta" },
    ],
    DevOps: [
      { name: "Docker", level: "İleri" },
      { name: "GitHub Actions", level: "İleri" },
      { name: "Vercel", level: "İleri" },
      { name: "Fly.io", level: "Orta" },
    ],
    "Data/Search": [
      { name: "Elasticsearch", level: "İleri" },
      { name: "Kibana", level: "Orta" },
    ],
  } as const;

  const experiences = [
    {
      company: "Acme Corp",
      role: "Senior Engineer",
      period: "2021 – Günümüz",
      achievements: [
        "Mikroservis mimarisiyle ölçeklenebilir API'ler tasarladım.",
        "%40 performans artışı sağlayan cache stratejileri geliştirdim.",
        "Takım mentörlüğü ve code review süreçlerini yönettim.",
      ],
    },
    {
      company: "Globex",
      role: "Fullstack Developer",
      period: "2018 – 2021",
      achievements: [
        "React ve .NET ile kurumsal dashboard geliştirdim.",
        "CI/CD pipeline'ları kurarak deploy süresini %60 azalttım.",
      ],
    },
    {
      company: "Initech",
      role: "Software Engineer",
      period: "2014 – 2018",
      achievements: [
        "Monolitik sistemi servis tabanlı mimariye taşıdım.",
        "Elasticsearch arama deneyimini optimize ettim.",
      ],
    },
  ];

  const projects = [
    {
      title: "Realtime Analytics",
      summary:
        "Gerçek zamanlı veri işleyen ve dashboard sunan SaaS platformu.",
      tags: ["Next.js", "Elasticsearch", "Redis"],
      href: "/projects/realtime-analytics",
    },
    {
      title: "E-commerce Core",
      summary:
        "Ölçeklenebilir .NET 9 tabanlı e-ticaret çekirdek kütüphanesi.",
      tags: [".NET", "PostgreSQL", "Docker"],
      href: "/projects/ecommerce-core",
    },
    {
      title: "Team Productivity",
      summary:
        "Takımlar için görev ve zaman yönetimi sağlayan web uygulaması.",
      tags: ["Next.js", "TypeScript", "Vercel"],
      href: "/projects/team-productivity",
    },
  ];

  return (
    <>
      <SiteNavbar />
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
                  {hasCV ? (
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
