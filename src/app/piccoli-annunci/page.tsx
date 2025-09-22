"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import ITALIAN_CITIES from "@/lib/cities";

type ApiItem = { id: number; name: string; slug: string; cities: string[]; coverUrl?: string | null; isVerified?: boolean };

export default function PiccoliAnnunciPage() {
  const [cat, setCat] = useState("");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ApiItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(40);

  const categories = [
    { k: 'eventi', t: 'Eventi' },
    { k: 'collab', t: 'Collaborazioni' },
    { k: 'servizi', t: 'Servizi' },
    { k: 'varie', t: 'Varie' },
  ];

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      try {
        const params = new URLSearchParams();
        params.set('type', 'VIRTUAL');
        if (city) params.set('citta', city);
        if (q) params.set('q', q);
        if (cat) params.set('categoria', cat);
        params.set('page', String(page));
        const res = await fetch(`/api/public/annunci?${params.toString()}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setItems((data.items || []) as ApiItem[]);
        setTotal(data.total || 0);
        setPageSize(data.pageSize || 40);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError('Errore caricamento annunci');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => ctrl.abort();
  }, [city, q, cat, page]);

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Piccoli Annunci</h1>
        <Link href="/dashboard/annunci/nuovo" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Pubblica annuncio</Link>
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6 grid md:grid-cols-3 gap-3">
        <select value={cat} onChange={e=>setCat(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
          <option value="">Categoria</option>
          {categories.map(c => <option key={c.k} value={c.k}>{c.t}</option>)}
        </select>
        <select value={city} onChange={e=>{ setCity(e.target.value); setPage(1); }} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
          <option value="">Città</option>
          {ITALIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} placeholder="Ricerca per testo libero" className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <button className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md">Cerca</button>
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {loading && (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-400">Caricamento…</div>
        )}
        {error && (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-red-300">{error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-400">Nessun annuncio trovato.</div>
        )}
        {!loading && !error && items.map(a => (
          <article key={a.id} className="rounded-xl border border-gray-700 bg-gray-800 overflow-hidden">
            <Link href={`/escort/${a.slug}`} className="grid md:grid-cols-[240px_1fr] gap-0">
              <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
                <Image src={a.coverUrl || '/placeholder.svg'} alt={a.name} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h2 className="text-white font-semibold mb-1 line-clamp-2">{a.name}</h2>
                <div className="text-xs text-gray-400">{a.isVerified ? '100% Verificato' : ''}</div>
                <div className="mt-3 grid sm:grid-cols-3 gap-2">
                  <div className="rounded-lg border border-gray-600 bg-gray-900 p-3">
                    <div className="text-xs text-gray-400">Localizzazione</div>
                    <div className="text-sm text-white">{a.cities?.[0] || '—'}</div>
                  </div>
                  <div className="rounded-lg border border-gray-600 bg-gray-900 p-3">
                    <div className="text-xs text-gray-400">Profilo</div>
                    <div className="text-sm text-blue-300">Apri</div>
                  </div>
                  <div className="rounded-lg border border-gray-600 bg-gray-900 p-3">
                    <div className="text-xs text-gray-400">Aggiornato</div>
                    <div className="text-sm text-white">—</div>
                  </div>
                </div>
                <div className="mt-3 text-right">
                  <span className="text-blue-400 text-sm">Mostra di più</span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {!loading && !error && total > pageSize && (
        <div className="flex items-center justify-between mt-6">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-2 rounded-md border border-gray-600 text-gray-300 disabled:opacity-50">« Precedente</button>
          <div className="text-sm text-gray-400">Pagina {page} di {Math.ceil(total/pageSize)}</div>
          <button onClick={()=>setPage(p=>p+1)} disabled={page >= Math.ceil(total/pageSize)} className="px-3 py-2 rounded-md border border-gray-600 text-gray-300 disabled:opacity-50">Successiva »</button>
        </div>
      )}
    </main>
  );
}
