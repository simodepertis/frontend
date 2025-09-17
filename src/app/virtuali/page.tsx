"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faVideo, faPhone, faComments } from "@fortawesome/free-solid-svg-icons";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionHeader from "@/components/SectionHeader";
import Image from "next/image";
import Link from "next/link";

const escortImgs = [
  "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5",
  "https://i.escortforumit.xxx/710869/profile/9c6cc2e7-5ad8-4684-bd96-fdfcfd6faa58_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/376078/profile/190aa487-a2dd-43ee-a4c2-5dff8c5fab49_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/703461/profile/28a91e4c-c6c3-4639-bae9-aeab4cbad15c_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/686141/profile/80cb7136-bcc1-4c01-9430-b8cbedd43a21_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1",
];

const services = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  model: ["Giulia", "Sara", "Elena", "Sofia"][i % 4],
  city: ["Milano", "Roma", "Firenze"][i % 3],
  type: ["Chat", "Videochiamata", "Chiamata"][i % 3],
  price: 20 + (i % 4) * 5,
  duration: 15 + (i % 3) * 15,
  note: "Disponibile su appuntamento. Pagamento anticipato.",
  photo: escortImgs[i % escortImgs.length],
  tier: ["Diamond", "Top", "Diamond"][i % 3],
  metrics: {
    video: (i * 2) % 5,
    reviews: (i * 3) % 7,
    comments: (i * 5) % 9,
  }
}));

export default function VirtualiPage() {
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [verified, setVerified] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasReviews, setHasReviews] = useState(false);
  const [q, setQ] = useState("");

  const filtered = services.filter(s => (!city || s.city === city) && (!type || s.type === type) && (!q || s.model.toLowerCase().includes(q.toLowerCase())));

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

      {/* Cards servizi con badge viola e metriche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <Link key={s.id} href="#" className="group block">
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl border shadow-sm bg-white">
              <Image src={s.photo} alt={s.model} fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute top-2 left-2">
                <span className="text-xs font-bold bg-purple-600 text-white rounded px-2 py-0.5">{s.tier}</span>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                <span className="text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5">📹 {s.metrics.video}</span>
                <span className="text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5">⭐ {s.metrics.reviews}</span>
                <span className="text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5">💬 {s.metrics.comments}</span>
              </div>
            </div>
            <div className="px-1.5 mt-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-800 truncate group-hover:underline">{s.model}</div>
                <div className="text-xs text-neutral-500">{s.city}</div>
              </div>
              <div className="mt-1 text-xs text-neutral-600 flex items-center gap-2">
                {s.type === 'Videochiamata' && <><FontAwesomeIcon icon={faVideo} className="text-neutral-600" /><span>Videochiamata</span></>}
                {s.type === 'Chat' && <><FontAwesomeIcon icon={faComments} className="text-neutral-600" /><span>Chat</span></>}
                {s.type === 'Chiamata' && <><FontAwesomeIcon icon={faPhone} className="text-neutral-600" /><span>Chiamata</span></>}
                <span className="text-neutral-500">· {s.duration} min</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-lg font-semibold">€ {s.price}</div>
                <button className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1.5 text-sm font-semibold">Prenota</button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
