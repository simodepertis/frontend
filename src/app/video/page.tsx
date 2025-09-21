"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import SectionHeader from "@/components/SectionHeader";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function VideoPage() {
  const [city, setCity] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(page), perPage: String(perPage) });
        if (city) qs.set('city', city);
        if (tag) qs.set('tag', tag);
        const res = await fetch(`/api/public/videos?${qs.toString()}`);
        if (res.ok) {
          const { items, total } = await res.json();
          setItems(items || []);
          setTotal(total || 0);
        } else { setItems([]); setTotal(0); }
      } finally { setLoading(false); }
    })();
  }, [city, tag, page]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxIdx === null) return;
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx((i) => i === null ? i : Math.min((items.length - 1), i + 1));
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => i === null ? i : Math.max(0, i - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, items.length]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / perPage)), [total]);

  return (
    <>
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Video" }]} />
      <SectionHeader title="Video" subtitle="Anteprime e clip recenti" />

      {/* Filtri */}
      <div className="mb-6 p-4 bg-neutral-100 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={city} onChange={(e)=>{setCity(e.target.value); setPage(1);}}>
            <option value="">Tutte le città</option>
            {/* TODO: popolare dinamicamente */}
            <option value="Milano">Milano</option>
            <option value="Roma">Roma</option>
            <option value="Torino">Torino</option>
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
        {!loading && items.length === 0 && (
          <div className="col-span-full text-sm text-neutral-500">Nessun video disponibile.</div>
        )}
        {items.map((video, idx) => (
          <div key={video.id} className="relative bg-white border rounded-lg shadow overflow-hidden group cursor-pointer" onClick={()=>setLightboxIdx(idx)}>
            <div className="relative w-full aspect-video">
              <Image src={video.thumb || '/placeholder.png'} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow">
                  <FontAwesomeIcon icon={faPlay} className="text-neutral-800" />
                </span>
              </div>
              <div className="absolute top-2 left-2 flex gap-1">
                {(video.verified || video.status === 'APPROVED') && <span className="text-[10px] font-bold bg-green-600 text-white rounded px-1.5 py-0.5">Verificato</span>}
                {video.hd && <span className="text-[10px] font-bold bg-black/70 text-white rounded px-1.5 py-0.5">HD</span>}
                {video.isNew && <span className="text-[10px] font-bold bg-red-600 text-white rounded px-1.5 py-0.5">Nuovo</span>}
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white">
                <span className="bg-black/60 rounded px-1.5 py-0.5">{video.city || '—'}</span>
                <span className="bg-black/60 rounded px-1.5 py-0.5">{video.duration || '—'}</span>
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
    {/* Lightbox */}
    {lightboxIdx !== null && items[lightboxIdx] && (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={()=>setLightboxIdx(null)}>
        <button className="absolute top-4 right-4 text-white text-2xl" aria-label="Chiudi">×</button>
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
          onClick={(e)=>{ e.stopPropagation(); setLightboxIdx(Math.max(0, (lightboxIdx||0)-1)); }}
          aria-label="Precedente"
        >‹</button>
        <div className="relative w-[92vw] max-w-[1100px]" onClick={(e)=>e.stopPropagation()}>
          <video src={items[lightboxIdx!].url} className="w-full h-full" controls autoPlay />
        </div>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
          onClick={(e)=>{ e.stopPropagation(); setLightboxIdx(Math.min(items.length-1, (lightboxIdx||0)+1)); }}
          aria-label="Successivo"
        >›</button>
      </div>
    )}
    </>
  );
}
