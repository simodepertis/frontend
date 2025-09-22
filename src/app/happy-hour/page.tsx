"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import EscortCard from "@/components/EscortCard";

type ApiItem = { id: number; name: string; slug: string; cities: string[]; coverUrl?: string | null; isVerified?: boolean; tier?: string };

export default function HappyHourPage() {
  const [qCity, setQCity] = useState("");
  const [qFree, setQFree] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({ verified: false, hasVideo: false, hasReviews: false, vip: false, natural: false, virtual: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ApiItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(40);

  const cities = ["Benevento","Foggia","Napoli","Salerno"]; // quick chips (facoltative)

  // Fetch from real public API (physical profiles branch)
  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      try {
        const params = new URLSearchParams();
        if (qCity) params.set('citta', qCity);
        if (qFree) params.set('q', qFree);
        params.set('page', String(page));
        const res = await fetch(`/api/public/annunci?${params.toString()}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setItems((data.items || []) as ApiItem[]);
        setTotal(data.total || 0);
        setPageSize(data.pageSize || 40);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError('Errore caricamento Happy Hour');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => ctrl.abort();
  }, [qCity, qFree, page]);

  const filtered = useMemo(() => {
    return items.filter(i => (!filters.verified || i.isVerified) && (!filters.vip || String(i.tier || '').toUpperCase() === 'VIP'))
  }, [items, filters]);

  function toggle(k: keyof typeof filters) {
    setFilters((f) => ({ ...f, [k]: !f[k] }));
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Barra: Trova escort nella tua città */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-4">
        <div className="text-white font-semibold mb-2">Trova escort nella tua città</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {cities.map(c => (
            <button key={c} onClick={() => setQCity(c)} className={`px-3 py-1 rounded-full border text-sm ${qCity===c? 'border-blue-600 bg-gray-700 text-white' : 'border-gray-600 text-gray-300'}`}>{c}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={qCity} onChange={e=>setQCity(e.target.value)} placeholder="Cerca la tua regione/città" className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <button className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md">Cerca</button>
        </div>
      </div>

      {/* Barra: Happy Hour con chips filtri + ricerca + view toggle */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-white font-semibold mr-2">Happy Hour</span>
          <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.verified? 'border-blue-600 text-white bg-gray-700' : 'border-gray-600 text-gray-300'}`}> 
            <input type="checkbox" checked={filters.verified} onChange={()=>toggle('verified')} className="mr-1"/> 100% Verificato
          </label>
          <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.hasVideo? 'border-blue-600 text-white bg-gray-700' : 'border-gray-600 text-gray-300'}`}>
            <input type="checkbox" checked={filters.hasVideo} onChange={()=>toggle('hasVideo')} className="mr-1"/> Ha video
          </label>
          <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.hasReviews? 'border-blue-600 text-white bg-gray-700' : 'border-gray-600 text-gray-300'}`}>
            <input type="checkbox" checked={filters.hasReviews} onChange={()=>toggle('hasReviews')} className="mr-1"/> Ha Recensioni
          </label>
          <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.vip? 'border-blue-600 text-white bg-gray-700' : 'border-gray-600 text-gray-300'}`}>
            <input type="checkbox" checked={filters.vip} onChange={()=>toggle('vip')} className="mr-1"/> VIP
          </label>
          <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.natural? 'border-blue-600 text-white bg-gray-700' : 'border-gray-600 text-gray-300'}`}>
            <input type="checkbox" checked={filters.natural} onChange={()=>toggle('natural')} className="mr-1"/> Foto Naturale
          </label>
          <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.virtual? 'border-blue-600 text-white bg-gray-700' : 'border-gray-600 text-gray-300'}`}>
            <input type="checkbox" checked={filters.virtual} onChange={()=>toggle('virtual')} className="mr-1"/> Servizi Virtuali
          </label>

          <div className="ml-auto flex items-center gap-2">
            <input value={qFree} onChange={e=>{ setQFree(e.target.value); setPage(1); }} placeholder="Cerca per nome, ecc." className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
            <div className="flex items-center gap-1">
              <button onClick={()=>setView('grid')} className={`px-2 py-2 rounded-md border ${view==='grid'?'border-blue-600 bg-gray-700 text-white':'border-gray-600 text-gray-300'}`}>▦</button>
              <button onClick={()=>setView('list')} className={`px-2 py-2 rounded-md border ${view==='list'?'border-blue-600 bg-gray-700 text-white':'border-gray-600 text-gray-300'}`}>≣</button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista risultati */}
      {loading && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-400">Caricamento…</div>
      )}
      {error && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-red-300">{error}</div>
      )}
      {!loading && !error && view === 'grid' ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((e) => (
            <Link key={e.id} href={`/escort/${e.slug}`}>
              <EscortCard escort={{ id: e.id, nome: e.name, slug: e.slug, photo: e.coverUrl || '/placeholder.svg', city: e.cities?.[0] || '', verified: e.isVerified } as any} />
            </Link>
          ))}
        </div>
      ) : (!loading && !error && (
        <div className="space-y-4">
          {filtered.map((e) => (
            <Link key={e.id} href={`/escort/${e.slug}`} className="block">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <div className="text-white font-semibold">{e.name}</div>
                <div className="text-sm text-gray-400">{e.cities?.[0] || '—'} · {e.isVerified ? 'Verificata' : '—'}</div>
              </div>
            </Link>
          ))}
        </div>
      ))}

      {/* Pagination */}
      {!loading && !error && total > pageSize && (
        <div className="flex items-center justify-between mt-6">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-2 rounded-md border border-gray-600 text-gray-300 disabled:opacity-50">« Precedente</button>
          <div className="text-sm text-gray-400">Pagina {page} di {Math.ceil(total/pageSize)}</div>
          <button onClick={()=>setPage(p=>p+1)} disabled={page >= Math.ceil(total/pageSize)} className="px-3 py-2 rounded-md border border-gray-600 text-gray-300 disabled:opacity-50">Successiva »</button>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mt-8 text-center">
        <div className="text-white font-semibold mb-2">Vuoi salire in cima durante l'Happy Hour?</div>
        <Link href="/dashboard/pubblicita" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Acquista Pubblicità</Link>
      </div>
    </main>
  );
}
