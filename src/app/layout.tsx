import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { VisitTracker } from "@/components/visit-tracker";
import { ProjectIframeModal } from "@/components/project-iframe-modal";

export const metadata: Metadata = {
  title: "Aytuğ — Blog",
  description: "Senior developer showcase + blog",
  metadataBase: new URL("https://senin-domainin.com"), // 👉 domainin
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "RSS Feed" }],
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
           <VisitTracker />
           {children}
           {/* Global project iframe modal */}
           <ProjectIframeModal />
         </ThemeProvider>
      </body>
    </html>
  );
}
