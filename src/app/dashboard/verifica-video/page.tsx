"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function VerificaVideoPage() {
  type VideoItem = { id: string; title: string; url: string; thumb?: string | null; duration?: string | null; status: "bozza" | "in_review" | "approvato" | "rifiutato" };
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumb, setThumb] = useState("");
  const [duration, setDuration] = useState("");
  const [hd, setHd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/API/escort/videos');
        if (res.ok) {
          const { videos } = await res.json();
          const mapped: VideoItem[] = (videos || []).map((v: any) => ({
            id: String(v.id),
            title: v.title,
            url: v.url,
            thumb: v.thumb,
            duration: v.duration,
            status: v.status === 'APPROVED' ? 'approvato' : v.status === 'REJECTED' ? 'rifiutato' : v.status === 'IN_REVIEW' ? 'in_review' : 'bozza',
          }));
          setVideos(mapped);
        }
      } catch {}
    })();
  }, []);

  const addVideo = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('url', url);
      if (title) fd.append('title', title);
      if (thumb) fd.append('thumb', thumb);
      if (duration) fd.append('duration', duration);
      fd.append('hd', String(hd));
      const res = await fetch('/API/escort/videos/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { video } = await res.json();
        setVideos((prev) => [{
          id: String(video.id),
          title: video.title,
          url: video.url,
          thumb: video.thumb,
          duration: video.duration,
          status: 'bozza',
        }, ...prev]);
        setTitle(""); setUrl(""); setThumb(""); setDuration(""); setHd(false);
      }
    } finally { setSubmitting(false); }
  };

  const removeVideo = async (id: string) => {
    setVideos((prev) => prev.filter(v => v.id !== id));
    try { await fetch('/API/escort/videos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(id) }) }); } catch {}
  };

  const sendForReview = async () => {
    setSubmitting(true);
    try {
      const drafts = videos.filter(v => v.status === 'bozza');
      await Promise.all(drafts.map(async (v) => {
        const idNum = Number(v.id);
        if (Number.isNaN(idNum)) return;
        try { await fetch('/API/escort/videos/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: idNum, action: 'in_review' }) }); } catch {}
      }));
      setVideos((prev) => prev.map(v => v.status === 'bozza' ? { ...v, status: 'in_review' } : v));
      alert('Video inviati per verifica.');
    } finally { setSubmitting(false); }
  };

  const canSubmit = useMemo(() => videos.some(v => v.status === 'bozza'), [videos]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Verifica Video" subtitle="Aggiungi e invia i tuoi video per la verifica" />

      {/* Linee guida */}
      <div className="rounded-lg border bg-white p-4">
        <div className="font-semibold mb-2">Linee Guida</div>
        <ul className="text-sm text-neutral-700 list-disc pl-5 space-y-1">
          <li>Carica solo contenuti che ti appartengono e rispettano le norme della piattaforma.</li>
          <li>Accettiamo URL diretti (mp4) o link HLS (m3u8). Per upload file diretto serve storage esterno (S3/R2).</li>
          <li>Inserisci un titolo descrittivo e, se possibile, una thumbnail.</li>
        </ul>
      </div>

      {/* Uploader per URL */}
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="font-semibold">Aggiungi Video via URL</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Titolo" className="border rounded-md px-3 py-2" />
          <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="URL Video (mp4/m3u8)" className="border rounded-md px-3 py-2" />
          <input value={thumb} onChange={(e)=>setThumb(e.target.value)} placeholder="Thumbnail URL (opzionale)" className="border rounded-md px-3 py-2" />
          <div className="grid grid-cols-[1fr,auto] gap-3">
            <input value={duration} onChange={(e)=>setDuration(e.target.value)} placeholder="Durata (es. 00:30)" className="border rounded-md px-3 py-2" />
            <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={hd} onChange={(e)=>setHd(e.target.checked)} /> HD</label>
          </div>
        </div>
        <div>
          <Button onClick={addVideo} disabled={submitting || !url.trim()}>{submitting ? 'Aggiungo…' : 'Aggiungi'}</Button>
        </div>
      </div>

      {/* Lista video */}
      <div className="rounded-lg border bg-white p-4">
        <div className="font-semibold mb-3">I tuoi video ({videos.length})</div>
        {videos.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessun video aggiunto. Inserisci l'URL per aggiungere un video.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <div key={v.id} className="border rounded-md overflow-hidden bg-white">
                <div className="relative w-full aspect-video bg-black grid place-items-center">
                  {v.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumb} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <video src={v.url} className="w-full h-full" controls preload="metadata" />
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium truncate max-w-[180px]" title={v.title}>{v.title || 'Video'}</div>
                    <div className="text-xs text-neutral-500">{v.duration || '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${v.status === 'approvato' ? 'bg-green-100 text-green-700' : v.status === 'rifiutato' ? 'bg-red-100 text-red-700' : v.status === 'in_review' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-700'}`}>
                      {v.status === 'bozza' ? 'Bozza' : v.status === 'in_review' ? 'In revisione' : v.status === 'approvato' ? 'Approvato' : 'Rifiutato'}
                    </span>
                    {v.status === 'bozza' && (
                      <Button variant="secondary" onClick={() => removeVideo(v.id)}>Rimuovi</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invio per verifica */}
      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={sendForReview}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Invio…' : 'Invia a verifica'}
        </Button>
      </div>
    </div>
  );
}
