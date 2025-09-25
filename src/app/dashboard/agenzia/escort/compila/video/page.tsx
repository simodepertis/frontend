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
  const [videos, setVideos] = useState<Array<any>>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [thumb, setThumb] = useState("");
  const [hd, setHd] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/agency/escort/video?escortUserId=${escortUserId}`, { credentials: 'include' });
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
      const res = await fetch('/api/agency/escort/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ escortUserId, url, title, duration, hd, thumb })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore upload'); }
      else { setUrl(''); setTitle(''); setDuration(''); setThumb(''); setHd(false); await load(); }
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm('Eliminare questo video?')) return;
    const res = await fetch('/api/agency/escort/video', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ escortUserId, id }) });
    if (res.ok) await load(); else alert('Errore eliminazione');
  }

  async function patch(id: number, data: any) {
    const res = await fetch('/api/agency/escort/video', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ escortUserId, id, ...data }) });
    if (res.ok) await load(); else alert('Errore aggiornamento');
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Video (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
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
                <div className="aspect-video bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                  {v.thumb ? (<img src={v.thumb} alt={v.title} className="max-h-full max-w-full object-contain" />) : ('Anteprima')}
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
