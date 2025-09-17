"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

const escortImgs = [
  "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5",
  "https://i.escortforumit.xxx/710869/profile/9c6cc2e7-5ad8-4684-bd96-fdfcfd6faa58_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/376078/profile/190aa487-a2dd-43ee-a4c2-5dff8c5fab49_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/703461/profile/28a91e4c-c6c3-4639-bae9-aeab4cbad15c_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/686141/profile/80cb7136-bcc1-4c01-9430-b8cbedd43a21_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1",
];

const data = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  name: ["Miss Julia", "Masha_New", "Brunna", "Selena", "Alina", "Vika", "Diana", "Nina", "Sofi", "Luna", "Maya", "Giorgia"][i % 12],
  city: ["Milano", "Padova", "Roma", "Bari"][i % 4],
  photo: escortImgs[i % escortImgs.length],
  rank: i + 1,
  metrics: {
    video: (i * 2) % 5,
    photo: (i * 3) % 9,
    reviews: (i * 5) % 12,
  },
  badge: i < 3 ? ["#1", "#2", "#3"][i] : "#Top 10",
  subtitle: i % 3 === 0 ? `In tour a ${["Roma", "Napoli", "Firenze"][i % 3]} fino al ${(10 + i)} set` : `Escort ${["Milano", "Roma", "Bari"][i % 3]}`,
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
