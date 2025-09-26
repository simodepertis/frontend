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
  const [videos, setVideos] = useState<Array<any>>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [thumb, setThumb] = useState("");
  const [hd, setHd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch(`/api/agency/escort/video?escortUserId=${escortUserId}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
      if (res.ok) {
        const j = await res.json();
        setVideos(j.videos || []);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { if (escortUserId) load(); else setLoading(false); }, [escortUserId]);

  async function add() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    if (!url || !title) { alert('Inserisci URL e Titolo'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/agency/escort/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ escortUserId, url, title, duration, hd, thumb })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore upload'); }
      else { setUrl(''); setTitle(''); setDuration(''); setThumb(''); setHd(false); await load(); }
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm('Eliminare questo video?')) return;
    const token = localStorage.getItem('auth-token') || '';
    const res = await fetch('/api/agency/escort/video', { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ escortUserId, id }) });
    if (res.ok) await load(); else alert('Errore eliminazione');
  }

  async function patch(id: number, data: any) {
    const token = localStorage.getItem('auth-token') || '';
    const res = await fetch('/api/agency/escort/video', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ escortUserId, id, ...data }) });
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
      alert('Video inviati in revisione insieme a foto e documenti.');
      await load(); // Ricarica per vedere eventuali cambi di stato
    } finally {
      setSubmitting(false);
    }
  }

  const hasVideos = videos.length > 0;

  return (
    <div className="space-y-6">
      <SectionHeader title="Video (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
        {/* Upload da file */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-white">Carica dal dispositivo</div>
            <Button onClick={()=> fileRef.current?.click()} disabled={!escortUserId}>Seleziona file video</Button>
          </div>
          <input ref={fileRef} type="file" accept="video/*" multiple className="hidden" onChange={async(e)=>{
            const files = e.target.files; if (!files || !files.length) return;
            for (const f of Array.from(files)) {
              const fd = new FormData();
              fd.append('file', f);
              fd.append('escortUserId', String(escortUserId));
              const token = localStorage.getItem('auth-token') || '';
              const res = await fetch('/api/agency/escort/videos/upload-file', { method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : undefined, body: fd });
              if (!res.ok) { const j = await res.json().catch(()=>({})); alert(j?.error || 'Errore upload'); }
            }
            (e.target as HTMLInputElement).value = '';
            await load();
          }} />
          <div className="text-xs text-gray-400">Formati video supportati. Limite 200MB per file.</div>
        </div>

        <div className="grid md:grid-cols-4 gap-2">
          <input value={url} onChange={(e)=> setUrl(e.target.value)} placeholder="URL video" className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
          <input value={title} onChange={(e)=> setTitle(e.target.value)} placeholder="Titolo" className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
          <input value={duration} onChange={(e)=> setDuration(e.target.value)} placeholder="Durata (es. 00:30)" className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
          <div className="flex gap-2">
            <input value={thumb} onChange={(e)=> setThumb(e.target.value)} placeholder="Thumb URL (opz.)" className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 placeholder-gray-400" />
            <label className="flex items-center gap-1 text-gray-300 text-sm"><input type="checkbox" checked={hd} onChange={(e)=> setHd(e.target.checked)} />HD</label>
            <Button onClick={add} disabled={saving || !url || !title}>{saving ? 'Caricamento…' : 'Aggiungi'}</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.map((v) => (
              <div key={v.id} className="border border-gray-600 rounded-md overflow-hidden bg-gray-900">
                <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                  {v.url ? (
                    <video 
                      src={v.url.startsWith('/uploads/') ? `/api${v.url}` : v.url} 
                      poster={v.thumb && v.thumb.startsWith('/uploads/') ? `/api${v.thumb}` : v.thumb || undefined}
                      className="max-h-full max-w-full object-contain"
                      controls
                      preload="metadata"
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="text-gray-400 text-xs p-2 text-center hidden items-center justify-center absolute inset-0 bg-gray-800">
                    Video: {v.title}
                  </div>
                </div>
                <div className="p-2 text-xs text-gray-300 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input defaultValue={v.title} onBlur={(e)=> patch(v.id, { title: e.target.value })} className="bg-gray-800 border border-gray-600 text-white rounded-md px-2 py-1 flex-1" />
                    <label className="flex items-center gap-1"><input type="checkbox" checked={!!v.hd} onChange={(e)=> patch(v.id, { hd: e.target.checked })} />HD</label>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <input defaultValue={v.duration || ''} onBlur={(e)=> patch(v.id, { duration: e.target.value })} className="bg-gray-800 border border-gray-600 text-white rounded-md px-2 py-1 flex-1" placeholder="Durata" />
                    <button className="text-red-300 hover:text-red-400" onClick={()=> del(v.id)}>Elimina</button>
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

      {/* Invio a verifica */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-2 text-white">Invio a verifica</div>
        <p className="text-sm text-gray-300 mb-4">
          Invia tutti i contenuti (foto, video e documenti) dell'escort per la revisione dell'admin.
        </p>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Video caricati: {videos.length}
          </div>
          <Button 
            onClick={sendForReview} 
            disabled={submitting || !escortUserId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? 'Invio…' : 'Invia tutto a verifica'}
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
