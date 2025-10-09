"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ReviewItem = {
  id: number;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  author?: { id: number; nome: string };
  target?: { id: number; nome: string; slug?: string };
};

export default function RecensioniPage() {
  const [tab, setTab] = useState<"ricevute" | "scritte">("ricevute");
  const [minStars, setMinStars] = useState(0);
  const [list, setList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const type = tab === 'ricevute' ? 'received' : 'written';
      const res = await fetch(`/api/me/reviews?type=${type}` , { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
      if (res.ok) {
        const j = await res.json();
        const items: ReviewItem[] = (j?.items || []) as any[];
        setList(items);
      } else {
        setList([]);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tab]);

  const filtered = useMemo(() => list.filter(r => (minStars ? (r.rating >= minStars) : true)), [list, minStars]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Recensioni" subtitle="Gestisci e consulta le tue recensioni" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3 py-1.5 rounded-md border cursor-pointer ${tab === 'ricevute' ? 'bg-gray-700 text-white border-blue-600' : 'border-gray-600 text-gray-300'}`} onClick={() => setTab("ricevute")}>Ricevute</div>
          <div className={`px-3 py-1.5 rounded-md border cursor-pointer ${tab === 'scritte' ? 'bg-gray-700 text-white border-blue-600' : 'border-gray-600 text-gray-300'}`} onClick={() => setTab("scritte")}>Scritte</div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>Min stelle</span>
            <select value={minStars} onChange={(e) => setMinStars(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-2 py-1">
              <option value={0}>Tutte</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={5}>5</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 divide-y divide-gray-700">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-400">Caricamento…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">Nessuna recensione</div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="p-4 flex items-start gap-4">
              <div className="text-sm text-gray-400 w-32 shrink-0">{new Date(r.createdAt).toLocaleDateString()}</div>
              <div className="flex-1">
                <div className="text-sm text-gray-300">
                  <span className="font-semibold text-white">{tab==='ricevute' ? (r.author?.nome || '—') : 'Tu'}</span>
                  {" "}→{" "}
                  <span className="font-semibold text-white">{tab==='ricevute' ? 'Tu' : (r.target?.nome || '—')}</span>
                </div>
                <div className="text-yellow-400 text-sm">{"★".repeat(r.rating)}<span className="text-gray-600">{"★".repeat(Math.max(0,5 - r.rating))}</span></div>
                <div className="text-white font-medium">{r.title}</div>
                <div className="text-sm text-gray-300 mt-1 whitespace-pre-line">{r.body}</div>
              </div>
              <div className="flex flex-col items-end gap-2 w-40">
                {r.target?.slug && (
                  <Link href={`/escort/${r.target.slug}`} className="text-blue-400 hover:underline text-sm">Vedi profilo</Link>
                )}
                {tab === "ricevute" ? (
                  <Button variant="secondary" size="sm" disabled>Rispondi (presto)</Button>
                ) : (
                  <Button variant="secondary" size="sm" disabled>Modifica (presto)</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
