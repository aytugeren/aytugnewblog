interface TimelineItemProps {
  company: string;
  role: string;
  period: string;
  achievements: string[];
}

export function TimelineItem({ company, role, period, achievements }: TimelineItemProps) {
  return (
    <li className="relative pl-8">
      <div className="absolute left-0 top-2 h-full w-px bg-border" aria-hidden />
      <span className="absolute left-0 top-2 -ml-1.5 h-3 w-3 rounded-full bg-primary" aria-hidden />
      <div>
        <h3 className="font-semibold leading-none">
          {company} <span className="text-muted-foreground">— {role}</span>
        </h3>
        <time className="mt-1 block text-sm text-muted-foreground">{period}</time>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {achievements.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </li>
  );
}
