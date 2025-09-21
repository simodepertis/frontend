"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ListaNeraClientiPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/me/blacklist');
      if (res.ok) { const j = await res.json(); setItems(j.items || []); }
      else setItems([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function addItem() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/me/blacklist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, note }) });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore inserimento'); return; }
      setName(""); setPhone(""); setNote("");
      await load();
    } finally { setSubmitting(false); }
  }

  async function removeItem(id: string) {
    const res = await fetch('/api/me/blacklist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const j = await res.json();
    if (!res.ok) { alert(j?.error || 'Errore cancellazione'); return; }
    await load();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Lista Nera Clienti" subtitle="Segnala e consulta clienti non graditi" />

      {/* Form inserimento */}
      <div className="rounded-lg border bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-600">Nome</label>
            <input className="border rounded-md px-3 py-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Es. Mario R." />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-600">Telefono</label>
            <input className="border rounded-md px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Es. 3331234567" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm text-neutral-600">Note</label>
            <input className="border rounded-md px-3 py-2" value={note} onChange={e=>setNote(e.target.value)} placeholder="Motivo segnalazione" />
          </div>
        </div>
        <div className="mt-3">
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={addItem} disabled={submitting || (!name && !phone && !note)}>{submitting ? 'Salvataggio…' : 'Aggiungi alla lista nera'}</Button>
        </div>
      </div>

      {/* Elenco segnalazioni */}
      <div className="rounded-lg border bg-white p-0 overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold">Segnalazioni ({items.length})</div>
        {loading ? (
          <div className="px-4 py-6 text-neutral-500">Caricamento…</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6 text-neutral-500">Nessuna segnalazione presente.</div>
        ) : (
          <div className="divide-y">
            {items.map((it:any) => (
              <div key={it.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-neutral-800 truncate">{it.name || '—'}</div>
                  <div className="text-sm text-neutral-600 truncate">{it.phone || '—'}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{it.note || '—'}</div>
                  <div className="text-xs text-neutral-400">{new Date(it.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <Button variant="secondary" onClick={()=>removeItem(it.id)}>Elimina</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
