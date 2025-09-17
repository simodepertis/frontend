"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { escorts as allEscorts } from "@/lib/mock";

const data = allEscorts
  .filter(e => typeof e.top10Rank === "number")
  .map(e => ({
    id: e.id,
    name: e.nome,
    city: e.city,
    photo: e.photo,
    rank: e.top10Rank as number,
    metrics: {
      video: e.metrics.videosCount,
      photo: e.metrics.photosCount,
      reviews: e.metrics.reviewsCount,
    },
    badge: (e.top10Rank ?? 99) <= 3 ? `#${e.top10Rank}` : "#Top 10",
    subtitle: e.inTour && e.tourUntil ? `In tour a ${e.city} fino al ${e.tourUntil}` : `Escort ${e.city}`,
  }));

export default function Top10Page() {
  const [city, setCity] = useState("");
  const [order, setOrder] = useState("Ranking");
  const [view, setView] = useState("Card");
  const [onlyActive, setOnlyActive] = useState(false);
  const [withComments, setWithComments] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let arr = data.filter(x => (!city || x.city === city) && (!q || x.name.toLowerCase().includes(q.toLowerCase())));
    if (order === "Ranking") arr = arr.sort((a,b) => a.rank - b.rank);
    if (order === "Nome") arr = arr.sort((a,b) => a.name.localeCompare(b.name));
    return arr.slice(0, 10);
  }, [city, order, q]);

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Top 10" }]} />
      <SectionHeader title="Top 10 Ragazze: La Scelta Dei Membri" subtitle="La classifica aggiornata in base alle preferenze dei membri" />

      {/* Info box con filtri e search */}
      <div className="mb-6 p-4 bg-neutral-100 border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={city} onChange={(e)=>setCity(e.target.value)}>
            <option value="">Città</option>
            <option>Milano</option>
            <option>Padova</option>
            <option>Roma</option>
            <option>Bari</option>
          </select>
          <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={order} onChange={(e)=>setOrder(e.target.value)}>
            <option>Ranking</option>
            <option>Nome</option>
          </select>
          <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={view} onChange={(e)=>setView(e.target.value)}>
            <option>Card</option>
            <option>Compatta</option>
          </select>
          <div className="relative">
            <input className="w-full bg-white border border-neutral-300 rounded-md pl-10 pr-3 py-2" placeholder="Cerca per nome" value={q} onChange={(e)=>setQ(e.target.value)} />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="accent-red-600" checked={onlyActive} onChange={(e)=>setOnlyActive(e.target.checked)} />
            Ragazze attive solo
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="accent-red-600" checked={withComments} onChange={(e)=>setWithComments(e.target.checked)} />
            Con commenti solo
          </label>
        </div>
      </div>

      {/* Griglia ranked cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <Link key={p.id} href="#" className="block group">
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl border shadow-sm bg-white">
              <Image src={p.photo} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                <span className="text-xs font-bold bg-black/70 text-white rounded px-2 py-0.5">#{p.rank}</span>
                <span className="text-xs font-bold bg-red-600 text-white rounded px-2 py-0.5">{p.badge}</span>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                <span className="text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5">📹 {p.metrics.video}</span>
                <span className="text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5">🖼️ {p.metrics.photo}</span>
                <span className="text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5">⭐ {p.metrics.reviews}</span>
              </div>
            </div>
            <div className="px-1.5 mt-2">
              <div className="text-sm font-semibold text-neutral-800 truncate hover:underline">{p.name}</div>
              <div className="text-xs text-neutral-500 truncate">{p.subtitle}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
