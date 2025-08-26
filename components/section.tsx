import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-prose text-muted-foreground leading-relaxed">
              {description}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}
