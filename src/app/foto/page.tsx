"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/SectionHeader";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function FotoPage() {
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
        const res = await fetch(`/api/public/photos?${qs.toString()}`);
        if (res.ok) {
          const { items, total } = await res.json();
          setItems(items || []);
          setTotal(total || 0);
        } else {
          setItems([]); setTotal(0);
        }
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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Foto" }]} />
      <SectionHeader title="Foto" subtitle="Galleria fotografica aggiornata" />

      {/* Filtri */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" value={city} onChange={(e)=>{ setCity(e.target.value); setPage(1); }}>
            <option value="">Tutte le città</option>
            {/* In futuro possiamo popolare dinamicamente la lista città da API */}
            <option value="Milano">Milano</option>
            <option value="Roma">Roma</option>
            <option value="Torino">Torino</option>
          </select>
          <select
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
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
        {!loading && items.length === 0 && (
          <div className="col-span-full text-sm text-gray-400">Nessuna foto disponibile.</div>
        )}
        {items.map((p, idx) => (
          <div key={p.id} className="relative group overflow-hidden rounded-xl border border-gray-600 shadow-sm hover:shadow-lg transition bg-gray-800 cursor-pointer" onClick={()=>setLightboxIdx(idx)}>
            <div className="relative w-full aspect-[3/4]">
              <img
                src={p.url || p.src}
                alt={`Foto ${p.id}`}
                className="object-cover group-hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                onError={(e)=>{ const t=e.currentTarget; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }}
              />
              <div className="absolute top-2 left-2 flex gap-1">
                {(p.verified || p.status === 'APPROVED') && (
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
                <span className="bg-black/60 rounded px-1.5 py-0.5">{p.city || '—'}</span>
                <span className="bg-black/60 rounded px-1.5 py-0.5">{p.price ? `€ ${p.price}` : 'Foto'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginazione */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>Precedente</Button>
        <span className="text-sm text-gray-300">Pagina {page} di {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((x) => Math.min(totalPages, x + 1))}>Successiva</Button>
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
        <div className="relative w-[90vw] max-w-[900px] aspect-[3/4]" onClick={(e)=>e.stopPropagation()}>
          <img
            src={(items[lightboxIdx!].url || items[lightboxIdx!].src)}
            alt={`Foto ${items[lightboxIdx!].id}`}
            className="object-contain absolute inset-0 w-full h-full"
            onError={(e)=>{ const t=e.currentTarget; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }}
          />
        </div>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
          onClick={(e)=>{ e.stopPropagation(); setLightboxIdx(Math.min(items.length-1, (lightboxIdx||0)+1)); }}
          aria-label="Successiva"
        >›</button>
      </div>
    )}
    </>
  );
}
