"use client";

import SectionHeader from "@/components/SectionHeader";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function Inner() {
  const params = useSearchParams();
  const escortUserId = Number(params?.get("escortUserId") || 0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Array<any>>([]);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [size, setSize] = useState<number>(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/agency/escort/foto?escortUserId=${escortUserId}`, { credentials: 'include' });
      if (res.ok) {
        const j = await res.json();
        setPhotos(j.photos || []);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { if (escortUserId) load(); else setLoading(false); }, [escortUserId]);

  async function add() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    if (!url || !name) { alert('Inserisci URL e Nome'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/agency/escort/foto', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ escortUserId, url, name, size: Number(size || 0) })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore upload'); }
      else { setUrl(''); setName(''); setSize(0); await load(); }
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm('Eliminare questa foto?')) return;
    const res = await fetch('/api/agency/escort/foto', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ escortUserId, id }) });
    if (res.ok) await load(); else alert('Errore eliminazione');
  }

  async function toggleFace(id: number, v: boolean) {
    const res = await fetch('/api/agency/escort/foto', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ escortUserId, id, isFace: v }) });
    if (res.ok) await load(); else alert('Errore aggiornamento');
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Galleria Foto (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
        <div className="grid md:grid-cols-3 gap-2">
          <input value={url} onChange={(e)=> setUrl(e.target.value)} placeholder="URL immagine" className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
          <input value={name} onChange={(e)=> setName(e.target.value)} placeholder="Nome file" className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
          <div className="flex gap-2">
            <input type="number" min={0} value={size} onChange={(e)=> setSize(Number(e.target.value))} placeholder="Bytes" className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
            <Button onClick={add} disabled={saving || !url || !name}>{saving ? 'Caricamento…' : 'Aggiungi'}</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="border border-gray-600 rounded-md overflow-hidden bg-gray-900">
                <div className="aspect-[3/2] bg-gray-800 flex items-center justify-center">
                  <img src={p.url} alt={p.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="p-2 text-xs text-gray-300 flex items-center justify-between">
                  <div className="truncate pr-2">{p.name}</div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={!!p.isFace} onChange={(e)=> toggleFace(p.id, e.target.checked)} />
                      <span>Volto</span>
                    </label>
                    <button className="text-red-300 hover:text-red-400" onClick={()=> del(p.id)}>Elimina</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <a href={`/dashboard/agenzia/escort/compila?escortUserId=${escortUserId}`} className="text-sm text-blue-400 hover:underline">« Torna all'hub</a>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Caricamento…</div>}>
      <Inner />
    </Suspense>
  );
}
