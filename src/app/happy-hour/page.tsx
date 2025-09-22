"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import EscortCard from "@/components/EscortCard";

type Item = { id: number; nome: string; citta: string; rank: string; foto: string; isVerified: boolean; slug: string };

export default function HappyHourPage() {
  const [qCity, setQCity] = useState("");
  const [qFree, setQFree] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({ verified: false, hasVideo: false, hasReviews: false, vip: true, natural: false, virtual: false });

  const cities = ["Benevento","Foggia","Napoli","Salerno"]; // esempio chips
  const items: Item[] = useMemo(() => ([
    { id: 1, nome: "Luiza", citta: "Napoli", rank: "vip", foto: "/placeholder.svg", isVerified: true, slug: "luiza-napoli" },
    { id: 2, nome: "Eva", citta: "Salerno", rank: "vip", foto: "/placeholder.svg", isVerified: false, slug: "eva-salerno" },
  ]), []);

  const filtered = items.filter(i =>
    (!qCity || i.citta.toLowerCase().includes(qCity.toLowerCase())) &&
    (!qFree || i.nome.toLowerCase().includes(qFree.toLowerCase())) &&
    (!filters.verified || i.isVerified)
  );

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
            <input value={qFree} onChange={e=>setQFree(e.target.value)} placeholder="Cerca per nome, ecc." className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
            <div className="flex items-center gap-1">
              <button onClick={()=>setView('grid')} className={`px-2 py-2 rounded-md border ${view==='grid'?'border-blue-600 bg-gray-700 text-white':'border-gray-600 text-gray-300'}`}>▦</button>
              <button onClick={()=>setView('list')} className={`px-2 py-2 rounded-md border ${view==='list'?'border-blue-600 bg-gray-700 text-white':'border-gray-600 text-gray-300'}`}>≣</button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista risultati */}
      {view === 'grid' ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((e) => (
            <Link key={e.id} href={`/escort/${e.slug}`}>
              <EscortCard escort={e as any} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((e) => (
            <Link key={e.id} href={`/escort/${e.slug}`} className="block">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <div className="text-white font-semibold">{e.nome}</div>
                <div className="text-sm text-gray-400">{e.citta} · {e.isVerified ? 'Verificata' : '—'}</div>
              </div>
            </Link>
          ))}
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
