import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { VisitTracker } from "@/components/visit-tracker";
import { ProjectIframeModal } from "@/components/project-iframe-modal";
import { ScrollToTop } from "@/components/scroll-to-top";
import { TurkishNormalizer } from "./components/turkish-normalizer";
import { UtfFixer } from "@/components/utf-fixer";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL as string) || "";
const siteName = "Aytug Eren";
const siteTitle = `${siteName} - Blog`;
const siteDescription = "Senior developer showcase + blog";

// Dynamic metadata from backend settings (if present)
export async function generateMetadata(): Promise<Metadata> {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL as string) || "";
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/settings`, { cache: "no-store" });
    if (res.ok) {
      const s = await res.json();
      const sUrl = (s?.siteUrl as string | undefined) || siteUrl;
      const sName = (s?.siteName as string | undefined) || siteName;
      const dTitle = (s?.defaultTitle as string | undefined) || siteTitle;
      const tmpl = (s?.titleTemplate as string | undefined) || "%s - Aytug Eren";
      const desc = (s?.description as string | undefined) || siteDescription;
      const kw = Array.isArray(s?.keywords) ? (s.keywords as string[]) : [
        "Aytug Eren",
        "Senior Developer",
        ".NET",
        "Frontend",
        "Blog",
      ];
      const twCreator = (s?.twitterCreator as string | undefined) || "@aytug";
      const loc = (s?.locale as string | undefined) || "tr_TR";
      const ogImg = (s?.defaultOgImage as string | undefined);
      return {
        title: { default: dTitle, template: tmpl },
        description: desc,
        ...(sUrl ? { metadataBase: new URL(sUrl) } : {}),
        keywords: kw,
        openGraph: {
          type: "website",
          url: sUrl || undefined,
          siteName: sName,
          title: dTitle,
          description: desc,
          locale: loc,
          ...(ogImg ? { images: [ogImg] } : {}),
        },
        twitter: {
          card: "summary_large_image",
          title: dTitle,
          description: desc,
          creator: twCreator,
          ...(ogImg ? { images: [ogImg] } : {}),
        },
        alternates: {
          canonical: "/",
          types: {
            "application/rss+xml": [{ url: "/rss.xml", title: dTitle }],
          },
        },
      } satisfies Metadata;
    }
  } catch {}
  // Fallback to defaults when settings are not available
  return {
    title: { default: siteTitle, template: "%s - Aytug Eren" },
    description: siteDescription,
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    keywords: [
      "Aytug Eren",
      "Aytuğ Eren",
      "Senior Developer",
      ".NET",
      "Frontend",
      "Software Engineering",
      "Blog",
    ],
    openGraph: {
      type: "website",
      url: siteUrl || undefined,
      siteName,
      title: siteTitle,
      description: siteDescription,
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      creator: "@aytug",
    },
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": [{ url: "/rss.xml", title: siteTitle }],
      },
    },
  } satisfies Metadata;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body suppressHydrationWarning className="min-h-dvh bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TurkishNormalizer />
          <UtfFixer />
          <VisitTracker />
          {children}
          {/* Global project iframe modal */}
          <ProjectIframeModal />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
