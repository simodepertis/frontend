"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import SectionHeader from "@/components/SectionHeader";
import Breadcrumbs from "@/components/Breadcrumbs";
import { videos as allVideos } from "@/lib/mock";

const mockVideos = allVideos;

export default function VideoPage() {
  const [city, setCity] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = mockVideos.filter((v) => (!city || v.city === city) && (!tag || (tag === "HD" ? v.hd : tag === "Nuova" ? v.isNew : tag === "Verificata" ? v.verified : true)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Video" }]} />
      <SectionHeader title="Video" subtitle="Anteprime e clip recenti" />

      {/* Filtri */}
      <div className="mb-6 p-4 bg-neutral-100 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={city} onChange={(e)=>{setCity(e.target.value); setPage(1);}}>
            <option value="">Tutte le città</option>
            {Array.from(new Set(allVideos.map(v=>v.city))).map(c=> <option key={c}>{c}</option>)}
          </select>
          <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={tag} onChange={(e)=>{setTag(e.target.value); setPage(1);}}>
            <option value="">Tutti i tag</option>
            <option value="HD">HD</option>
            <option value="Nuova">Nuova</option>
            <option value="Verificata">Verificata</option>
          </select>
          <div className="md:col-span-2" />
        </div>
      </div>

      {/* Video Grid UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {pageItems.map((video) => (
          <div key={video.id} className="relative bg-white border rounded-lg shadow overflow-hidden group">
            <div className="relative w-full aspect-video">
              <Image src={video.thumb} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow">
                  <FontAwesomeIcon icon={faPlay} className="text-neutral-800" />
                </span>
              </div>
              <div className="absolute top-2 left-2 flex gap-1">
                {video.verified && <span className="text-[10px] font-bold bg-green-600 text-white rounded px-1.5 py-0.5">Verificato</span>}
                {video.hd && <span className="text-[10px] font-bold bg-black/70 text-white rounded px-1.5 py-0.5">HD</span>}
                {video.isNew && <span className="text-[10px] font-bold bg-red-600 text-white rounded px-1.5 py-0.5">Nuovo</span>}
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white">
                <span className="bg-black/60 rounded px-1.5 py-0.5">{video.city}</span>
                <span className="bg-black/60 rounded px-1.5 py-0.5">{video.duration}</span>
              </div>
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-neutral-800 line-clamp-1">{video.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginazione finta */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Precedente</Button>
        <span className="text-sm text-neutral-600">Pagina {page} di {totalPages}</span>
        <Button variant="outline" disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Successiva</Button>
      </div>
    </main>
  );
}
