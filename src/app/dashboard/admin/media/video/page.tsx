"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
// Nota: usiamo <img> per le anteprime per evitare blocchi di domini/signed URL con next/image
import { Button } from "@/components/ui/button";

export default function AdminMediaVideoPage() {
  type Item = { id: number; url: string; thumb?: string|null; title: string; duration?: string|null; status: string; createdAt: string; userId: number };
  const [status, setStatus] = useState<'IN_REVIEW' | 'APPROVED' | 'REJECTED' >('IN_REVIEW');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const r = await fetch(`/api/admin/media/videos?status=${status}`, { headers });
      if (r.ok) {
        const j = await r.json();
        setItems(j.items || []);
      } else {
        setItems([]);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [status]);

  async function act(id: number, action: 'approve'|'reject') {
    setActingId(id);
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      };
      
      const r = await fetch('/api/admin/media/videos', { 
        method: 'PATCH', 
        headers, 
        body: JSON.stringify({ id, action }) 
      });
      const j = await r.json();
      if (!r.ok) { alert(j?.error || 'Errore'); return; }
      await load();
    } finally { setActingId(null); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Moderazione Video" subtitle="Approva o rifiuta video caricati dagli utenti" />

      <div className="flex items-center gap-2">
        <select className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
          <option value="IN_REVIEW">In revisione</option>
          <option value="APPROVED">Approvati</option>
          <option value="REJECTED">Rifiutati</option>
        </select>
        <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Aggiorno…' : 'Ricarica'}</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400">Nessun elemento</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(it => (
            <div key={it.id} className="border border-gray-600 rounded-md overflow-hidden bg-gray-800">
              <div className="relative w-full aspect-video">
                {it.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.thumb.startsWith('/uploads/') ? ('/api' + it.thumb) : it.thumb}
                    alt={`Video ${it.id}`}
                    className="object-cover absolute inset-0 w-full h-full"
                    onError={(e)=>{ const t=e.currentTarget as HTMLImageElement; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }}
                  />
                ) : (
                  <video
                    className="object-cover absolute inset-0 w-full h-full bg-black"
                    preload="metadata"
                    muted
                    controls
                  >
                    <source src={it.url?.startsWith('/uploads/') ? ('/api' + it.url) : it.url} />
                  </video>
                )}
                <a
                  href={it.url?.startsWith('/uploads/') ? ('/api' + it.url) : it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-black/60 hover:bg-black/80 text-white border border-white/20"
                  title="Apri in nuova scheda"
                >
                  Apri
                </a>
              </div>
              <div className="p-2 text-xs text-gray-300 flex items-center justify-between">
                <span className="line-clamp-1">{it.title || `Video ${it.id}`}</span>
                <span className={`px-2 py-0.5 rounded-full ${it.status==='APPROVED'?'bg-green-600 text-green-100':it.status==='REJECTED'?'bg-red-600 text-red-100':'bg-amber-600 text-amber-100'}`}>{it.status}</span>
              </div>
              <div className="px-2 pb-2 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Utente {it.userId}</span>
                <span>{it.duration || '—'}</span>
              </div>
              {status === 'IN_REVIEW' && (
                <div className="p-2 flex items-center gap-2">
                  <Button className="h-8 bg-green-600 hover:bg-green-700" onClick={()=>act(it.id,'approve')} disabled={actingId===it.id}>{actingId===it.id?'…':''} Approva</Button>
                  <Button className="h-8 bg-red-600 hover:bg-red-700" onClick={()=>act(it.id,'reject')} disabled={actingId===it.id}>Rifiuta</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
