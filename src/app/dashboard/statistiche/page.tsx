"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";

export default function StatisticheProfiloPage() {
  type Range = "7d" | "30d" | "90d";
  const [range, setRange] = useState<Range>("7d");
  const [apiData, setApiData] = useState<null | { views: number; contactClicks: number; saves: number; bookings: number; ctr: number; conv: number; trend: { x: number; y: number }[]; topCities: { name: string; value: number }[]; topServices: { name: string; value: number }[]; referrers: { name: string; value: number }[] }>(null);

  useEffect(() => { try { const r = localStorage.getItem("stats-range"); if (r === "7d" || r === "30d" || r === "90d") setRange(r); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("stats-range", range); } catch {} }, [range]);

  // Mock KPI in base al range
  const kpi = useMemo(() => {
    const mult = range === "7d" ? 1 : range === "30d" ? 3.5 : 7;
    const views = Math.round(420 * mult);
    const contactClicks = Math.round(88 * mult);
    const saves = Math.round(36 * mult);
    const bookings = Math.round(14 * mult);
    const ctr = Math.round(((contactClicks / Math.max(1, views)) * 100) * 10) / 10; // % con 1 decimale
    const conv = Math.round(((bookings / Math.max(1, views)) * 100) * 10) / 10; // % con 1 decimale
    const mock = { views, contactClicks, saves, bookings, ctr, conv };
    if (apiData) return { views: apiData.views, contactClicks: apiData.contactClicks, saves: apiData.saves, bookings: apiData.bookings, ctr: apiData.ctr, conv: apiData.conv };
    return mock;
  }, [range, apiData]);

  // Mock trend data
  const trend = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    if (apiData?.trend?.length) return apiData.trend;
    return Array.from({ length: days }, (_, i) => ({ x: i + 1, y: Math.round(40 + Math.sin(i / 3) * 15 + Math.random() * 10) }));
  }, [range, apiData]);

  const topCities = useMemo(() => apiData?.topCities || [
    { name: "Milano", value: 38 },
    { name: "Roma", value: 26 },
    { name: "Torino", value: 14 },
    { name: "Bologna", value: 9 },
  ], [apiData]);
  const topServices = useMemo(() => apiData?.topServices || [
    { name: "Massaggio", value: 31 },
    { name: "Accompagnamento", value: 22 },
    { name: "GFE", value: 18 },
    { name: "Servizi VIP", value: 10 },
  ], [apiData]);
  const referrers = useMemo(() => apiData?.referrers || [
    { name: "Google", value: 42 },
    { name: "Telegram", value: 18 },
    { name: "Direct", value: 25 },
    { name: "Social", value: 15 },
  ], [apiData]);

  // Fetch from backend when range changes
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/stats/summary?range=${range}`);
        if (res.ok) {
          const data = await res.json();
          setApiData(data);
        } else {
          setApiData(null);
        }
      } catch {
        setApiData(null);
      }
    })();
  }, [range]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Statistiche del Profilo" subtitle="Visualizzazioni, click, salvataggi e conversioni" />

      {/* Selettore intervallo */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600">Intervallo temporale</div>
        <div className="flex items-center gap-2">
          {(["7d","30d","90d"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-md border text-sm ${range === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>{r === '7d' ? '7 giorni' : r === '30d' ? '30 giorni' : '90 giorni'}</button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Visualizzazioni" value={kpi.views} delta="+8%" />
        <KpiCard title="Click Contatto" value={kpi.contactClicks} delta="+5%" />
        <KpiCard title="Salvataggi" value={kpi.saves} delta="+3%" />
        <KpiCard title="Prenotazioni" value={kpi.bookings} delta="+2%" />
      </div>

      {/* CTR e Conversion */}
      <div className="grid gap-4 md:grid-cols-2">
        <KpiSimple title="CTR (%)" value={`${kpi.ctr}%`} note="Click Contatto / Visualizzazioni" />
        <KpiSimple title="Conversione (%)" value={`${kpi.conv}%`} note="Prenotazioni / Visualizzazioni" />
      </div>

      {/* Trend semplificato */}
      <div className="rounded-lg border bg-white p-4">
        <div className="font-semibold mb-2">Andamento Visualizzazioni</div>
        <div className="h-40 w-full bg-neutral-100 rounded-md relative overflow-hidden">
          <div className="absolute inset-0 p-2 flex items-end gap-1">
            {trend.map((p) => (
              <div key={p.x} className="bg-blue-500 flex-1" style={{ height: `${Math.max(4, Math.min(100, p.y))}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Top liste */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TopList title="Top Città" items={topCities} />
        <TopList title="Top Servizi" items={topServices} />
        <TopList title="Sorgenti Traffico" items={referrers} />
      </div>
    </div>
  );
}

function KpiCard({ title, value, delta }: { title: string; value: number; delta: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-neutral-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-green-700 bg-green-100 inline-block mt-2 px-2 py-0.5 rounded-full">{delta}</div>
    </div>
  );
}

function KpiSimple({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-neutral-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{note}</div>
    </div>
  );
}

function TopList({ title, items }: { title: string; items: { name: string; value: number }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-semibold mb-2">{title}</div>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div>{i.name}</div>
              <div className="text-neutral-600">{i.value}</div>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-2 bg-blue-500" style={{ width: `${Math.round((i.value / total) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
