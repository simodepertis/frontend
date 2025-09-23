"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
import EscortCard from "@/components/EscortCard";
import FilterBar from "@/components/FilterBar";

const cittaOptions = ["Milano", "Roma", "Firenze"]; // TODO: collegare a elenco reale
const capelliOptions = ["Biondi", "Castani", "Neri"]; // TODO: collegare a elenco reale

function kebab(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'');
}

export default function Home() {
  const [filtroCitta, setFiltroCitta] = useState("");
  const [filtroCapelli, setFiltroCapelli] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|undefined>();

  useEffect(() => {
    (async () => {
      setLoading(true); setError(undefined);
      try {
        const res = await fetch('/api/public/annunci');
        if (!res.ok) throw new Error('Errore caricamento annunci');
        const json = await res.json();
        setItems(json.items || []);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Errore';
        setError(msg);
      } finally { setLoading(false); }
    })();
  }, []);

  const featured = useMemo(() => items.filter(i => i.tier === 'VIP' || i.girlOfTheDay).slice(0, 8), [items]);
  const recentEscorts = useMemo(() => items.slice(0, 12).map((e:any) => ({
    ...e,
    isNew: true,
    slug: e.slug || `${kebab(e.name)}-${e.id}`
  })), [items]);

  const escortsFiltrate = useMemo(() => {
    // Per ora filtra per città se presente; capelli è placeholder
    return items.filter((e:any) => {
      const inCity = !filtroCitta || (Array.isArray(e.cities) && e.cities.some((c:any)=> String(c).toLowerCase().includes(filtroCitta.toLowerCase())));
      return inCity;
    });
  }, [items, filtroCitta, filtroCapelli]);

  return (
    <main className="flex flex-col min-h-[calc(100vh-80px)] container mx-auto px-4 py-8">
      
      {/* SEZIONE FILTRI DI RICERCA */}
      <FilterBar title="Trova la tua compagnia ideale" actions={
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-2 h-auto rounded-md">
          <FontAwesomeIcon icon={faSearch} className="mr-2"/>
          Cerca
        </Button>
      }>
        <div className="flex flex-col gap-1">
          <label htmlFor="citta" className="text-sm font-medium text-gray-300">Città</label>
          <select
            id="citta"
            className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtroCitta}
            onChange={(e) => setFiltroCitta(e.target.value)}
          >
            <option value="">Tutte le città</option>
            {cittaOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="capelli" className="text-sm font-medium text-gray-300">Colore Capelli</label>
          <select
            id="capelli"
            className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtroCapelli}
            onChange={(e) => setFiltroCapelli(e.target.value)}
          >
            <option value="">Tutti i capelli</option>
            {capelliOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </FilterBar>

      {/* IN EVIDENZA (VIP / Ragazza del Giorno) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">In evidenza</h3>
          <Link href="/annunci" className="text-sm text-blue-600 underline">Vedi tutti</Link>
        </div>
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : featured.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun profilo in evidenza al momento.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {featured.map((p:any) => (
                <Link key={p.id} href={`/escort/${p.slug || `${kebab(p.name)}-${p.id}`}`} className="shrink-0">
                  <div className="w-20">
                    <div className="relative w-20 h-20 rounded-full ring-2 ring-blue-200 hover:ring-blue-400 transition overflow-hidden bg-gray-700">
                      <Image src={p.coverUrl || "/placeholder.svg"} alt={p.name} fill className="object-cover" />
                      {p.tier && p.tier !== 'STANDARD' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-bold text-black">{p.tier === 'VIP' ? '👑' : p.tier === 'TITANIO' ? '🛡️' : p.tier === 'ORO' ? '⭐' : '💎'}</span>
                        </div>
                      )}
                    </div>
                    <div className="w-20 truncate text-[11px] text-center mt-1 text-gray-300">{p.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STRIP NUOVE ISCRITTE */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Nuove iscritte</h3>
        </div>
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {recentEscorts.map((p:any) => (
              <Link key={p.slug} href={`/escort/${p.slug}`} className="shrink-0">
                <div className="w-16">
                  <div className="relative w-16 h-16 rounded-full ring-2 ring-blue-200 hover:ring-blue-400 transition overflow-hidden bg-gray-700">
                    <Image src={p.coverUrl || "/placeholder.svg"} alt={p.name} fill className="object-cover" />
                  </div>
                  {p.isNew && (
                    <div className="mt-1 w-full flex justify-center">
                      <span className="inline-flex items-center justify-center px-2 h-5 text-[10px] font-extrabold leading-none tracking-tight bg-blue-600 text-white rounded-full shadow">
                        NEW
                      </span>
                    </div>
                  )}
                  <div className="w-16 truncate text-[11px] text-center mt-1 text-gray-300">{p.name}</div>
                </div>
              </Link>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* GRIGLIA PROFILI */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 flex-grow">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-10">Caricamento…</div>
        ) : escortsFiltrate.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-10">
            Nessun risultato trovato. Prova a modificare i filtri.
          </div>
        ) : (
          escortsFiltrate.map((escort:any) => (
            <Link key={escort.id} href={`/escort/${escort.slug || `${kebab(escort.name)}-${escort.id}`}`}>
              <EscortCard escort={{ id: escort.id, nome: escort.name, eta: 25, citta: Array.isArray(escort.cities)&&escort.cities[0]?String(escort.cities[0]):'—', capelli: '', prezzo: escort.price || 0, foto: escort.coverUrl || "/placeholder.svg", rank: escort.tier, isVerified: !!escort.hasApprovedDoc }} />
            </Link>
          ))
        )}
      </div>

    </main>
  );
}
