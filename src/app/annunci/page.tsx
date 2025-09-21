"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faBolt, faCrown, faStar, faLocationDot, faPhone, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";

export default function AnnunciPage() {
  const [city, setCity] = useState("");
  const [tipo, setTipo] = useState("Tutti"); // Tutti | Fisici | Virtuali
  const [withWhatsApp, setWithWhatsApp] = useState(false);
  const [withPhone, setWithPhone] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 40;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (city) params.set('citta', city);
        params.set('page', String(page));
        if (tipo === 'Virtuali') params.set('type', 'VIRTUAL');
        if (q) params.set('q', q);
        const res = await fetch(`/api/public/annunci?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
          setTotal(data.total || 0);
        } else {
          setItems([]); setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [city, tipo, page, q]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);
  const tiers: Record<string, { label: string; className: string; icon?: any }> = {
    VIP: { label: 'VIP', className: 'bg-yellow-500 text-white', icon: faCrown },
    TITANIO: { label: 'TITANIO', className: 'bg-sky-700 text-white' },
    ORO: { label: 'ORO', className: 'bg-amber-500 text-white', icon: faStar },
    ARGENTO: { label: 'ARGENTO', className: 'bg-gray-400 text-white' },
    STANDARD: { label: 'STANDARD', className: 'bg-neutral-300 text-neutral-800' },
  };

  const filtered = useMemo(() => {
    let arr = items.slice();
    if (withWhatsApp) arr = arr.filter((x:any) => x.contacts && x.contacts.whatsapp);
    if (withPhone) arr = arr.filter((x:any) => x.contacts && x.contacts.phone);
    return arr;
  }, [items, withWhatsApp, withPhone]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-neutral-800">Annunci</h1>

      {/* Filtri */}
      <div className="mb-6 p-4 bg-white rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600">Categoria</label>
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2">
              <option>Tutte</option>
              <option>Escort</option>
              <option>Massaggi</option>
              <option>Compagnia</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600">Tipo</label>
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={tipo} onChange={(e)=>{ setTipo(e.target.value); setPage(1); }}>
              <option>Tutti</option>
              <option>Fisici</option>
              <option>Virtuali</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600">Città</label>
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={city} onChange={(e)=>{ setCity(e.target.value); setPage(1); }}>
              <option value="">Tutte</option>
              <option>Milano</option>
              <option>Roma</option>
              <option>Firenze</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-neutral-600">Ricerca per testo libero</label>
            <div className="relative">
              <input className="w-full bg-white border border-neutral-300 rounded-md pl-10 pr-3 py-2" placeholder="Cerca..." value={q} onChange={(e)=> { setQ(e.target.value); setPage(1); }} />
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          <div>Risultati: {total} {city ? `a ${city}` : ''}</div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="accent-red-600" checked={withWhatsApp} onChange={(e)=> setWithWhatsApp(e.target.checked)} /> Con WhatsApp
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="accent-red-600" checked={withPhone} onChange={(e)=> setWithPhone(e.target.checked)} /> Con Telefono
          </label>
        </div>
      </div>

      {/* Lista annunci stile elenco */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg border bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-neutral-500">Nessun annuncio trovato.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((it) => {
            const t = tiers[it.tier] || tiers.STANDARD;
            const cityLabel = Array.isArray(it.cities) && it.cities.length ? String(it.cities[0]) : '—';
            return (
              <div key={it.id} className="rounded-lg border bg-white p-3 md:p-4">
                <div className="flex gap-3">
                  <div className="relative w-28 h-28 shrink-0 rounded-md overflow-hidden bg-neutral-100 border">
                    <Image src={it.coverUrl || '/placeholder.svg'} alt={it.name} fill className="object-cover" />
                    <div className="absolute left-1 top-1 flex gap-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.className}`}>{t.label}</span>
                      {it.girlOfTheDay && <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-600 text-white">Giorno</span>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/escort/${it.slug}`} className="font-semibold text-neutral-900 hover:underline line-clamp-1">{it.name}</Link>
                        <div className="mt-1 text-sm text-neutral-600 line-clamp-2">{it.bio ? String(it.bio).slice(0,140) + (String(it.bio).length>140?'…':'') : `Annuncio aggiornato · Priorità ${it.priority}`}</div>
                      </div>
                      <div className="text-xs text-neutral-500 whitespace-nowrap">ID: {it.id}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs">
                        <FontAwesomeIcon icon={faLocationDot} className="text-neutral-600" /> {cityLabel}
                      </span>
                      {it.isVerified && (
                        <span className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs bg-emerald-50 border-emerald-200 text-emerald-700">Verificata</span>
                      )}
                      {it.onTour && (
                        <span className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs bg-sky-50 border-sky-200 text-sky-700">In tour</span>
                      )}
                      {it.contacts?.phone && (
                        <a href={`tel:${it.contacts.phone}`} className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs">
                          <FontAwesomeIcon icon={faPhone} className="text-neutral-600" /> {it.contacts.phone}
                        </a>
                      )}
                      {it.contacts?.email && (
                        <a href={`mailto:${it.contacts.email}`} className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs">
                          <FontAwesomeIcon icon={faEnvelope} className="text-neutral-600" /> Scrivimi
                        </a>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-neutral-500 flex items-center gap-2">
                      <FontAwesomeIcon icon={faBolt} width={12} /> Priorità {it.priority}
                    </div>
                    <div className="mt-2 text-right">
                      <Link href={`/escort/${it.slug}`} className="text-sm text-blue-700 hover:underline">Mostra di più »</Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginazione */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button className="h-9" variant="secondary" onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}>Prev</Button>
          <div className="text-sm">Pagina {page} di {totalPages}</div>
          <Button className="h-9" onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </main>
  );
}
