"use client";

import SectionHeader from "@/components/SectionHeader";
import EscortPicker from "@/components/EscortPicker";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_VIDEOS = 10;
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch('/api/escort/videos', { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
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
    // Carica ruolo utente
    (async () => {
      try {
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch('/api/user/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const userData = await res.json();
          setUserRole(userData?.user?.ruolo || '');
        }
      } catch {}
    })();
  }, []);

  const addVideo = async () => {
    if (!url.trim()) return;
    if (videos.length >= MAX_VIDEOS) { alert(`Limite massimo di ${MAX_VIDEOS} video raggiunto`); return; }
    setSubmitting(true);
    try {
      const params = new URLSearchParams();
      params.set('url', url);
      if (title) params.set('title', title);
      if (thumb) params.set('thumb', thumb);
      if (duration) params.set('duration', duration);
      params.set('hd', String(hd));
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/escort/videos/upload', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: params.toString() });
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
      } else {
        const j = await res.json().catch(()=>({}));
        alert(j?.error || 'Errore upload URL');
      }
    } finally { setSubmitting(false); }
  };

  const removeVideo = async (id: string) => {
    setVideos((prev) => prev.filter(v => v.id !== id));
    try { 
      const token = localStorage.getItem('auth-token') || '';
      await fetch('/api/escort/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: Number(id) })
      });
    } catch {}
  };

  const sendForReview = async () => {
    setSubmitting(true);
    try {
      const drafts = videos.filter(v => v.status === 'bozza');
      await Promise.all(drafts.map(async (v) => {
        const idNum = Number(v.id);
        if (Number.isNaN(idNum)) return;
        try { 
          const token = localStorage.getItem('auth-token') || '';
          await fetch('/api/escort/videos/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token? { 'Authorization': `Bearer ${token}`}: {}) }, body: JSON.stringify({ id: idNum, action: 'in_review' }) }); 
        } catch {}
      }));
      setVideos((prev) => prev.map(v => v.status === 'bozza' ? { ...v, status: 'in_review' } : v));
      alert('Video inviati per verifica.');
    } finally { setSubmitting(false); }
  };

  // Upload da dispositivo (galleria/desktop)
  const onSelectVideoFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) {
        alert(`${file.name}: formato non supportato. Usa MP4, WebM, MOV, AVI.`);
        continue;
      }
      // Limite 15MB per Vercel (base64 è ~33% più grande)
      const MAX_SIZE = 15 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        alert(`${file.name}: video troppo grande (${sizeMB}MB). Massimo 15MB.\n\nSuggerimenti:\n- Comprimi il video con HandBrake o simili\n- Riduci risoluzione (es. 720p)\n- Usa link esterno (YouTube/Vimeo)`);
        continue;
      }
      if (videos.length >= MAX_VIDEOS) { alert(`Limite massimo di ${MAX_VIDEOS} video raggiunto`); break; }
      
      // Anteprima locale
      const tempUrl = URL.createObjectURL(file);
      const tempId = `temp-${file.name}-${file.size}-${Date.now()}`;
      const temp: VideoItem = {
        id: tempId,
        title: file.name,
        url: tempUrl,
        thumb: null,
        duration: '',
        status: 'bozza',
      };
      setVideos((prev) => [temp, ...prev]);
      
      // Converti in base64
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch('/api/escort/videos/upload-file', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            url: base64,
            title: file.name,
            size: file.size
          }),
        });
        
        if (res.ok) {
          const { video } = await res.json();
          setVideos((prev) => prev.map(v => v.id === tempId ? {
            id: String(video.id),
            title: video.title || file.name,
            url: video.url,
            thumb: video.thumb || null,
            duration: video.duration || '',
            status: 'bozza',
          } : v));
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err?.error || 'Errore upload video');
          setVideos((prev) => prev.filter(v => v.id !== tempId));
        }
      } catch (e: any) {
        console.error('Errore upload video:', e);
        alert('Errore durante il caricamento del video');
        setVideos((prev) => prev.filter(v => v.id !== tempId));
      }
    }
    // reset input
    try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
  };

  const canSubmit = useMemo(() => videos.some(v => v.status === 'bozza'), [videos]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Verifica Video" subtitle="Aggiungi e invia i tuoi video per la verifica" />
      {/* Selezione Escort (solo per Agenzia) */}
      {userRole === 'agenzia' && (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
          <div className="grid md:grid-cols-[1fr,auto] gap-3 items-end">
            <EscortPicker onChange={(uid)=>{ if (uid) window.location.href = `/dashboard/agenzia/escort/compila/video?escortUserId=${uid}`; }} />
            <a className="text-sm text-blue-400 hover:underline" href="/dashboard/agenzia/escort">Gestione Escort Agenzia »</a>
          </div>
        </div>
      )}

      {/* Linee guida */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-2 text-white">Linee Guida</div>
        <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
          <li>Carica solo contenuti che ti appartengono e rispettano le norme della piattaforma.</li>
          <li>Accettiamo URL diretti (mp4) o link HLS (m3u8). Per upload file diretto serve storage esterno (S3/R2).</li>
          <li>Inserisci un titolo descrittivo e, se possibile, una thumbnail.</li>
        </ul>
      </div>

      {/* Uploader da dispositivo */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-3">
        <div className="font-semibold text-white">Carica Video dal dispositivo</div>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e)=>onSelectVideoFiles(e.target.files)} />
          <Button onClick={()=>fileInputRef.current?.click()} disabled={submitting || videos.length >= MAX_VIDEOS} title={videos.length >= MAX_VIDEOS ? `Hai raggiunto ${MAX_VIDEOS} video` : ''}>Seleziona file video</Button>
        </div>
        <div className="text-xs text-neutral-500">Formati video supportati. Limite 200MB per file. ({videos.length}/{MAX_VIDEOS})</div>
      </div>

      {/* Uploader per URL */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-3">
        <div className="font-semibold text-white">Aggiungi Video via URL</div>
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
          <Button onClick={addVideo} disabled={submitting || !url.trim() || videos.length >= MAX_VIDEOS} title={videos.length >= MAX_VIDEOS ? `Hai raggiunto ${MAX_VIDEOS} video` : ''}>{submitting ? 'Aggiungo…' : 'Aggiungi'}</Button>
        </div>
      </div>

      {/* Lista video */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-3">I tuoi video ({videos.length})</div>
        {videos.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun video aggiunto. Inserisci l'URL per aggiungere un video.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <div key={v.id} className="border border-gray-600 rounded-md overflow-hidden bg-gray-700">
                <div className="relative w-full aspect-video bg-black grid place-items-center">
                  {v.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumb?.startsWith('/uploads/') ? ('/api' + v.thumb) : v.thumb} alt={v.title} className="w-full h-full object-contain bg-black" />
                  ) : (
                    <video src={v.url?.startsWith('/uploads/') ? ('/api' + v.url) : v.url} className="w-full h-full object-contain bg-black" controls preload="metadata" />
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
