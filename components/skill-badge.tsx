import { ReactNode } from "react";

interface SkillBadgeProps {
  children: ReactNode;
}

export function SkillBadge({ children }: SkillBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      {children}
    </span>
  );
}
