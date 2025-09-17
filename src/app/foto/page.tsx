"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import SectionHeader from "@/components/SectionHeader";
import Breadcrumbs from "@/components/Breadcrumbs";
import { photos as allPhotos } from "@/lib/mock";

const mockPhotos = allPhotos;

export default function FotoPage() {
  const [city, setCity] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = mockPhotos.filter((p) => (!city || p.city === city) && (!tag || (p.hd ? tag === "HD" : tag !== "HD")));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Foto" }]} />
      <SectionHeader title="Foto" subtitle="Galleria fotografica aggiornata" />

      {/* Filtri */}
      <div className="mb-6 p-4 bg-neutral-100 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="bg-white border border-neutral-300 rounded-md px-3 py-2"
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
          >
            <option value="">Tutte le città</option>
            {Array.from(new Set(allPhotos.map(p => p.city))).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="bg-white border border-neutral-300 rounded-md px-3 py-2"
            value={tag}
            onChange={(e) => { setTag(e.target.value); setPage(1); }}
          >
            <option value="">Tutti i tag</option>
            <option value="HD">HD</option>
            <option value="Nuova">Nuova</option>
            <option value="Verificata">Verificata</option>
          </select>
          <div className="md:col-span-2" />
        </div>
      </div>

      {/* Griglia foto con badge */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {pageItems.map((p) => (
          <div key={p.id} className="relative group overflow-hidden rounded-xl border shadow-sm hover:shadow-lg transition bg-white">
            <div className="relative w-full aspect-[3/4]">
              <Image src={p.src} alt={`Foto ${p.id}`} fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute top-2 left-2 flex gap-1">
                {p.verified && (
                  <span className="text-[10px] font-bold bg-green-600 text-white rounded px-1.5 py-0.5">Verificata</span>
                )}
                {p.hd && (
                  <span className="text-[10px] font-bold bg-black/70 text-white rounded px-1.5 py-0.5">HD</span>
                )}
                {p.isNew && (
                  <span className="text-[10px] font-bold bg-red-600 text-white rounded px-1.5 py-0.5">Nuova</span>
                )}
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-white">
                <span className="bg-black/60 rounded px-1.5 py-0.5">{p.city}</span>
                <span className="bg-black/60 rounded px-1.5 py-0.5">Foto</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginazione finta */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>Precedente</Button>
        <span className="text-sm text-neutral-600">Pagina {page} di {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((x) => Math.min(totalPages, x + 1))}>Successiva</Button>
      </div>
    </main>
  );
}
