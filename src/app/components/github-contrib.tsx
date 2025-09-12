"use client";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

type Day = { date: string; count: number; color?: string | null };
type Week = { days: Day[] };

export function GitHubContrib({ user = "aytugeren" }: { user?: string }) {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL as string) || "";
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await fetch(`${base.replace(/\/$/, "")}/api/github/contributions?user=${encodeURIComponent(user)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`GitHub verisi alınamadı (${res.status})`);
        const j = await res.json();
        setWeeks(Array.isArray(j?.weeks) ? j.weeks : []);
        setTotal(Number(j?.total ?? 0));
      } catch (e: any) {
        setError(e.message || "Hata");
      }
    })();
  }, [base, user]);

  const flat = useMemo(() => weeks.flatMap(w => w.days), [weeks]);
  const isDark = (resolvedTheme ?? "light") === "dark";
  const maxCount = useMemo(() => flat.reduce((m, d) => Math.max(m, d.count || 0), 0), [flat]);

  function colorFor(count: number): string {
    if (count <= 0) return isDark ? "#161b22" : "#ebedf0";
    if (maxCount <= 0) return isDark ? "#0e4429" : "#9be9a8";
    const ratio = count / maxCount;
    // GitHub-like 4-level scale
    const light = ["#9be9a8", "#40c463", "#30a14e", "#216e39"];
    const dark = ["#0e4429", "#006d32", "#26a641", "#39d353"];
    const palette = isDark ? dark : light;
    if (ratio <= 0.25) return palette[0];
    if (ratio <= 0.5) return palette[1];
    if (ratio <= 0.75) return palette[2];
    return palette[3];
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!weeks.length) return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">Son 1 yılda toplam {total} katkı</div>
      <div className="rounded-md border p-3 bg-neutral-100 dark:bg-[#0d1117]">
        <div className="flex gap-1 overflow-x-auto" aria-label="GitHub katkı takvimi">
          {weeks.map((w, wi) => (
            <div key={wi} className="grid grid-rows-7 gap-1">
              {w.days.map((d, di) => (
                <div
                  key={`${wi}-${di}`}
                  title={`${d.date}: ${d.count} katkı`}
                  className="h-3 w-3 rounded-[2px] border border-neutral-300 dark:border-neutral-700"
                  style={{ backgroundColor: colorFor(d.count) }}
                  aria-label={`${d.date} ${d.count} katkı`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
