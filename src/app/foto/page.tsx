"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import SectionHeader from "@/components/SectionHeader";
import Breadcrumbs from "@/components/Breadcrumbs";

const escortPhotos = [
  "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5",
  "https://i.escortforumit.xxx/710869/profile/9c6cc2e7-5ad8-4684-bd96-fdfcfd6faa58_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/376078/profile/190aa487-a2dd-43ee-a4c2-5dff8c5fab49_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/703461/profile/28a91e4c-c6c3-4639-bae9-aeab4cbad15c_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/686141/profile/80cb7136-bcc1-4c01-9430-b8cbedd43a21_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1",
];

const mockPhotos = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  src: escortPhotos[i % escortPhotos.length],
  city: ["Milano", "Roma", "Firenze"][i % 3],
  tag: ["Interni", "Esterni", "Studio"][i % 3],
}));

export default function FotoPage() {
  const [city, setCity] = useState("");
  const [tag, setTag] = useState("");

  const filtered = mockPhotos.filter((p) => (!city || p.city === city) && (!tag || p.tag === tag));

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Foto" }]} />
      <SectionHeader title="Foto" subtitle="Galleria fotografica aggiornata" />

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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600">Tag</label>
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={tag} onChange={(e)=>setTag(e.target.value)}>
              <option value="">Tutti</option>
              <option>Interni</option>
              <option>Esterni</option>
              <option>Studio</option>
            </select>
          </div>
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10">
            <FontAwesomeIcon icon={faSearch} className="mr-2"/>
            Cerca
          </Button>
        </div>
      </div>

      {/* Griglia foto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="relative group overflow-hidden rounded-xl border shadow-sm hover:shadow-lg transition-shadow bg-white">
            <div className="relative w-full aspect-[3/4]">
              <Image src={p.src} alt={`Foto ${p.id}`} fill className="object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="px-3 py-2 text-xs text-neutral-600 flex items-center justify-between border-t">
              <span>{p.city}</span>
              <span className="bg-neutral-100 border rounded-full px-2 py-0.5">{p.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
