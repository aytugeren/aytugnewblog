"use client";
interface SkillBarProps {
  name: string;
  level: string | number; // 0-100
}

export function SkillBar({ name, level }: SkillBarProps) {
  const num = Math.max(0, Math.min(100, typeof level === "string" ? parseInt(level, 10) || 0 : level));

  const gradient =
    num >= 80
      ? "linear-gradient(90deg,#34d399,#10b981)"
      : num >= 50
      ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
      : "linear-gradient(90deg,#f87171,#ef4444)";

  return (
    <div className="space-y-1" title={`${name} • ${num}%`}>
      <div className="flex items-center justify-between text-sm">
        <span>{name}</span>
        <span className="tabular-nums text-muted-foreground">{num}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="skillbar-fill h-2 rounded-full shadow-sm"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={num}
          style={{ width: `${num}%`, background: gradient } as React.CSSProperties}
        />
        <div className="skillbar-shine pointer-events-none absolute inset-0 rounded-full" />
      </div>
    </div>
  );
}

import React from "react";
