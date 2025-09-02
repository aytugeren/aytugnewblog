"use client";
import { useEffect, useState } from "react";

type Check = { url: string; ok: boolean; status: number; ms: number; size: number; encodingWarnings?: string[]; error?: string }

type StatusData = {
  ok: boolean;
  origin: string;
  checkedAt: string;
  avgMs: number;
  hasErrors: boolean;
  anyEncoding: boolean;
  results: Check[];
  aiSummary?: string | null;
}

export function SiteStatusPanel() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/site-status', { cache: 'no-store' });
      if (!res.ok) throw new Error('Durum alınamadı');
      const j = await res.json();
      setData(j);
    } catch (e: any) {
      setError(e.message || 'Hata');
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const badge = (ok: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
      {ok ? 'OK' : 'Hata'}
    </span>
  );

  return (
    <section className="border rounded p-4 space-y-3 bg-white/50">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Site Durumu (AI)</h2>
        <button onClick={load} className="px-2 py-1 text-sm border rounded">Yenile</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && !error && <p className="text-sm text-gray-500">Yükleniyor…</p>}
      {data && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">Ortam: {data.origin} • Ortalama yanıt: {data.avgMs}ms</div>
          <div className="grid gap-2">
            {data.results.map((r) => (
              <div key={r.url} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {badge(r.ok)}
                  <span className="font-mono">{new URL(r.url).pathname}</span>
                </div>
                <div className="text-gray-600">
                  {r.status} • {r.ms}ms • {Math.round(r.size / 1024)}KB{r.encodingWarnings?.length ? ' • Kodlama uyarısı' : ''}
                </div>
              </div>
            ))}
          </div>
          {data.aiSummary && (
            <div className="rounded border p-3 bg-background">
              <div className="text-xs uppercase text-gray-500 mb-1">AI Öneri</div>
              <div className="text-sm whitespace-pre-wrap">{data.aiSummary}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
