"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionHeader from "@/components/SectionHeader";
import Image from "next/image";
import Link from "next/link";

export default function VirtualiPage() {
  const [city, setCity] = useState("");
  const [type, setType] = useState("Videochiamata");
  const [verified, setVerified] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasReviews, setHasReviews] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 24;

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams();
      params.set('type','VIRTUAL');
      if (city) params.set('citta', city);
      params.set('page', String(page));
      const res = await fetch(`/api/public/annunci?${params.toString()}`);
      if (res.ok) {
        const j = await res.json();
        setItems(j.items || []);
        setTotal(j.total || 0);
      } else {
        setItems([]); setTotal(0);
      }
    })();
  }, [city, page]);

  const filtered = useMemo(() => {
    // Filtrini client per demo (q, flags)
    return items.filter((it) => (!q || String(it.name).toLowerCase().includes(q.toLowerCase())));
  }, [items, q]);

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Servizi Virtuali" }]} />
      <SectionHeader title="Servizi Virtuali" subtitle="Chat, chiamate e videochiamate in modo sicuro" />

      {/* Info/Filter bar come nel riferimento */}
      <div className="mb-6 p-4 bg-neutral-100 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={city} onChange={(e)=>setCity(e.target.value)}>
            <option value="">Città</option>
            <option>Milano</option>
            <option>Roma</option>
            <option>Firenze</option>
          </select>
          <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="">Tipologia</option>
            <option>Chat</option>
            <option>Videochiamata</option>
            <option>Chiamata</option>
          </select>
          <div className="relative">
            <input className="w-full bg-white border border-neutral-300 rounded-md pl-10 pr-3 py-2" placeholder="Cerca per nome" value={q} onChange={(e)=>setQ(e.target.value)} />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold h-10">Cerca</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="accent-red-600" checked={verified} onChange={(e)=>setVerified(e.target.checked)} />
            100% Verificato
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="accent-red-600" checked={hasVideo} onChange={(e)=>setHasVideo(e.target.checked)} />
            Ha video
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="accent-red-600" checked={hasReviews} onChange={(e)=>setHasReviews(e.target.checked)} />
            Ha recensioni
          </label>
        </div>
      </div>

      {/* Cards servizi con badge e metriche; ora da API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s: any) => (
          <Link key={s.id} href={`/escort/${s.slug}`} className="group block">
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl border shadow-sm bg-white">
              <Image src={s.coverUrl || '/placeholder.svg'} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute top-2 left-2">
                <span className="text-xs font-bold bg-purple-600 text-white rounded px-2 py-0.5">VIRTUALE</span>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                <span className="text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5">{Array.isArray(s.cities)&&s.cities[0]?s.cities[0]:'Online'}</span>
              </div>
            </div>
            <div className="px-1.5 mt-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-800 truncate group-hover:underline">{s.name}</div>
                <div className="text-xs text-neutral-500">{Array.isArray(s.cities)&&s.cities[0]?s.cities[0]:'—'}</div>
              </div>
              <div className="mt-1 text-xs text-neutral-600 flex items-center gap-2" />
              <div className="mt-2 flex items-center justify-between">
                <div className="text-lg font-semibold">&nbsp;</div>
                <button className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1.5 text-sm font-semibold">Prenota</button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
