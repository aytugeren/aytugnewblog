import { SiteNavbar } from "./components/site-navbar";

export default function HomePage() {
  return (
    <>
      <SiteNavbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Merhaba 👋</h1>
        <p className="mt-3 text-muted-foreground">
          Bu, Next.js + Tailwind + shadcn tabanlı blog başlangıç iskeleti.
        </p>
      </main>
    </>
  );
}
