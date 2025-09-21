"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import Image from "next/image";
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
      const r = await fetch(`/API/admin/media/videos?status=${status}`);
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
      const r = await fetch('/API/admin/media/videos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
      const j = await r.json();
      if (!r.ok) { alert(j?.error || 'Errore'); return; }
      await load();
    } finally { setActingId(null); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Moderazione Video" subtitle="Approva o rifiuta video caricati dagli utenti" />

      <div className="flex items-center gap-2">
        <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
          <option value="IN_REVIEW">In revisione</option>
          <option value="APPROVED">Approvati</option>
          <option value="REJECTED">Rifiutati</option>
        </select>
        <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Aggiorno…' : 'Ricarica'}</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-neutral-500">Nessun elemento</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(it => (
            <div key={it.id} className="border rounded-md overflow-hidden bg-white">
              <div className="relative w-full aspect-video">
                <Image src={it.thumb || '/placeholder.png'} alt={`Video ${it.id}`} fill className="object-cover" />
              </div>
              <div className="p-2 text-xs text-neutral-700 flex items-center justify-between">
                <span className="line-clamp-1">{it.title || `Video ${it.id}`}</span>
                <span className={`px-2 py-0.5 rounded-full ${it.status==='APPROVED'?'bg-green-100 text-green-700':it.status==='REJECTED'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{it.status}</span>
              </div>
              <div className="px-2 pb-2 text-[11px] text-neutral-500 flex items-center justify-between">
                <span>Utente {it.userId}</span>
                <span>{it.duration || '—'}</span>
              </div>
              {status === 'IN_REVIEW' && (
                <div className="p-2 flex items-center gap-2">
                  <Button className="h-8" onClick={()=>act(it.id,'approve')} disabled={actingId===it.id}>{actingId===it.id?'…':''} Approva</Button>
                  <Button className="h-8" variant="secondary" onClick={()=>act(it.id,'reject')} disabled={actingId===it.id}>Rifiuta</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
