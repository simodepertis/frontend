"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faSearch } from "@fortawesome/free-solid-svg-icons";
import SectionHeader from "@/components/SectionHeader";
import Breadcrumbs from "@/components/Breadcrumbs";

const escortThumbs = [
  "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5",
  "https://i.escortforumit.xxx/710869/profile/9c6cc2e7-5ad8-4684-bd96-fdfcfd6faa58_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/376078/profile/190aa487-a2dd-43ee-a4c2-5dff8c5fab49_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/703461/profile/28a91e4c-c6c3-4639-bae9-aeab4cbad15c_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/686141/profile/80cb7136-bcc1-4c01-9430-b8cbedd43a21_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1",
];

const mockVideos = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  thumb: escortThumbs[i % escortThumbs.length],
  title: `Anteprima Video #${i + 1}`,
  duration: `${2 + (i % 6)}:${(10 + i) % 60}`,
  city: ["Milano", "Roma", "Firenze"][i % 3],
}));

export default function VideoPage() {
  const [city, setCity] = useState("");

  const filtered = mockVideos.filter((v) => (!city || v.city === city));

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Video" }]} />
      <SectionHeader title="Video" subtitle="Anteprime e clip recenti" />

      {/* Filtri */}
      <div className="mb-8 p-6 bg-neutral-100 rounded-lg shadow-md border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600">Città</label>
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={city} onChange={(e)=>setCity(e.target.value)}>
              <option value="">Tutte</option>
              <option>Milano</option>
              <option>Roma</option>
              <option>Firenze</option>
            </select>
          </div>
          <div className="hidden md:block" />
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10">
            <FontAwesomeIcon icon={faSearch} className="mr-2"/>
            Cerca
          </Button>
        </div>
      </div>

      {/* Griglia video */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((v) => (
          <div key={v.id} className="group bg-white border rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
            <div className="relative w-full aspect-video">
              <Image src={v.thumb} alt={v.title} fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <div className="w-12 h-12 bg-red-600 text-white rounded-full grid place-items-center shadow">
                  <FontAwesomeIcon icon={faPlay} />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 text-[11px] bg-black/70 text-white rounded px-2 py-0.5">{v.duration}</span>
            </div>
            <div className="px-3 py-2 text-sm">
              <div className="font-semibold text-neutral-800 truncate">{v.title}</div>
              <div className="text-neutral-500 text-xs">{v.city}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
