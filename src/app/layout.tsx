import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { VisitTracker } from "@/components/visit-tracker";
import { ProjectIframeModal } from "@/components/project-iframe-modal";
import { ScrollToTop } from "@/components/scroll-to-top";
import { TurkishNormalizer } from "./components/turkish-normalizer";

export const metadata: Metadata = {
  title: "Aytu\u011F Y \u2014 Blog",
  description: "Senior developer showcase + blog",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "Aytu\u011F Y \u2014 Blog" }],
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body suppressHydrationWarning className="min-h-dvh bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TurkishNormalizer />
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
