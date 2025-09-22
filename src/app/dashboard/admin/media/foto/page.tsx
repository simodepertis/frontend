"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function AdminMediaFotoPage() {
  type Item = { id: number; url: string; name?: string; status: string; createdAt: string; userId: number };
  const [status, setStatus] = useState<'IN_REVIEW' | 'APPROVED' | 'REJECTED' >('IN_REVIEW');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const r = await fetch(`/api/admin/media/photos?status=${status}`, { headers });
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
      
      const r = await fetch('/api/admin/media/photos', { 
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
      <SectionHeader title="Admin · Moderazione Foto" subtitle="Approva o rifiuta foto caricate dagli utenti" />

      <div className="flex items-center gap-2">
        <select className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
          <option value="IN_REVIEW">In revisione</option>
          <option value="APPROVED">Approvate</option>
          <option value="REJECTED">Rifiutate</option>
        </select>
        <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Aggiorno…' : 'Ricarica'}</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400">Nessun elemento</div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map(it => (
            <div key={it.id} className="border border-gray-600 rounded-md overflow-hidden bg-gray-800">
              <div className="relative w-full aspect-[3/4]">
                <Image src={it.url} alt={`Foto ${it.id}`} fill className="object-cover" />
              </div>
              <div className="p-2 text-xs text-gray-300 flex items-center justify-between">
                <span>Utente {it.userId}</span>
                <span className={`px-2 py-0.5 rounded-full ${it.status==='APPROVED'?'bg-green-600 text-green-100':it.status==='REJECTED'?'bg-red-600 text-red-100':'bg-amber-600 text-amber-100'}`}>{it.status}</span>
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
