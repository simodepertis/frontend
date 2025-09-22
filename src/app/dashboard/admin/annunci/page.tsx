"use client";

import { useEffect, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";

export default function AdminAnnunciModerazionePage() {
  type Item = { id: number; title: string; city: string; type: string; createdAt: string; user?: { id: number; nome?: string } };
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  async function load() {
    setLoading(true); setErr("");
    try {
      const res = await fetch('/api/admin/listings?status=IN_REVIEW');
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Errore');
      setItems(j.items || []);
    } catch (e:any) {
      setErr(e?.message || 'Errore');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function act(id: number, action: 'PUBLISH'|'REJECT') {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Errore');
      await load();
    } catch (e) {
      alert('Errore operazione');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Moderazione Annunci" subtitle="Approva o rifiuta gli annunci creati dagli utenti" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        {loading ? (
          <div className="text-gray-400 text-sm">Caricamento…</div>
        ) : err ? (
          <div className="text-red-300 text-sm">{err}</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400 text-sm">Nessun annuncio in revisione.</div>
        ) : (
          <div className="space-y-3">
            {items.map(i => (
              <div key={i.id} className="border border-gray-600 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-sm">{i.title}</div>
                  <div className="text-xs text-gray-400">{i.city} · {i.type} · Autore: {i.user?.nome || i.user?.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" disabled={updating===i.id} onClick={()=>act(i.id,'REJECT')}>Rifiuta</Button>
                  <Button disabled={updating===i.id} onClick={()=>act(i.id,'PUBLISH')}>Pubblica</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
