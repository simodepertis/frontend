"use client";

import SectionHeader from "@/components/SectionHeader";
import { Suspense, useEffect, useRef, useState } from "react";
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
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch(`/api/agency/escort/foto?escortUserId=${escortUserId}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
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
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/agency/escort/foto', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ escortUserId, url, name, size: Number(size || 0) })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore upload'); }
      else { setUrl(''); setName(''); setSize(0); await load(); }
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm('Eliminare questa foto?')) return;
    const token = localStorage.getItem('auth-token') || '';
    const res = await fetch('/api/agency/escort/foto', { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ escortUserId, id }) });
    if (res.ok) await load(); else alert('Errore eliminazione');
  }

  async function toggleFace(id: number, v: boolean) {
    const token = localStorage.getItem('auth-token') || '';
    const res = await fetch('/api/agency/escort/foto', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ escortUserId, id, isFace: v }) });
    if (res.ok) await load(); else alert('Errore aggiornamento');
  }

  async function sendForReview() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/agency/escort/submit', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ escortUserId })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { alert(j?.error || 'Errore invio a verifica'); return; }
      alert('Foto inviate in revisione. Requisiti: min 3 foto, almeno una col volto.');
      await load(); // Ricarica per vedere eventuali cambi di stato
    } finally {
      setSubmitting(false);
    }
  }

  const faceCount = photos.filter((p: any) => !!p.isFace).length;
  const hasFace = faceCount >= 1;
  const hasMinPhotos = photos.length >= 3;
  const canSubmit = hasMinPhotos && hasFace;

  return (
    <div className="space-y-6">
      <SectionHeader title="Galleria Foto (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
        {/* Upload da file */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-white">Carica dal dispositivo</div>
            <Button onClick={()=> fileRef.current?.click()} disabled={!escortUserId}>Seleziona immagini</Button>
          </div>
          <input ref={fileRef} onChange={async (e)=>{
            const files = e.target.files; if (!files || !files.length) return;
            for (const f of Array.from(files)) {
              const fd = new FormData();
              fd.append('file', f);
              fd.append('escortUserId', String(escortUserId));
              const token = localStorage.getItem('auth-token') || '';
              const res = await fetch('/api/agency/escort/photos/upload', { method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : undefined, body: fd });
              if (!res.ok) { const j = await res.json().catch(()=>({})); alert(j?.error || 'Errore upload'); }
            }
            (e.target as HTMLInputElement).value = '';
            await load();
          }} type="file" accept="image/*" multiple className="hidden" />
          <div className="text-xs text-gray-400">Formati: JPG/PNG. Max 8MB per file.</div>
        </div>

        {/* Aggiungi da URL */}
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
                <div className="relative aspect-[3/2] bg-gray-800 flex items-center justify-center">
                  <img src={p.url} alt={p.name} className="max-h-full max-w-full object-contain" />
                  <div className="absolute top-2 left-2 flex gap-2">
                    {p.isFace && (
                      <span className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded">Volto</span>
                    )}
                    {p.status && (
                      <span className="text-xs font-bold bg-gray-900/80 text-white px-2 py-1 rounded">{p.status}</span>
                    )}
                  </div>
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

      {/* Requisiti e invio a verifica */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-2 text-white">Requisiti per la verifica</div>
        <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1 mb-4">
          <li>Minimo 3 foto totali</li>
          <li>Almeno 1 foto del volto chiaramente visibile</li>
          <li>Immagini nitide e di buona qualità</li>
          <li>Nessun watermark invadente</li>
        </ul>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Stato: {photos.length >= 3 ? '3+ foto ✓' : `${3 - photos.length} foto mancanti`} · {hasFace ? 'volto ✓' : 'volto mancante'}
          </div>
          <Button 
            onClick={sendForReview} 
            disabled={!canSubmit || submitting || !escortUserId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? 'Invio…' : 'Invia a verifica'}
          </Button>
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
