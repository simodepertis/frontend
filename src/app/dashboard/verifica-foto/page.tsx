"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";

export default function VerificaFotoPage() {
  // SEMPLICE: array di URL base64
  const [photos, setPhotos] = useState<string[]>([]);
  const [faceIndex, setFaceIndex] = useState<number>(-1); // Indice foto con volto
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Documenti & Consenso (ripristino)
  type DocItem = { id: string; type: 'ID_CARD_FRONT' | 'ID_CARD_BACK' | 'SELFIE_WITH_ID'; url: string; status: 'in_review' | 'approvato' | 'rifiutato' };
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docType, setDocType] = useState<'ID_CARD_FRONT' | 'ID_CARD_BACK' | 'SELFIE_WITH_ID'>('ID_CARD_FRONT');
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null>(null);
  const [consentTick, setConsentTick] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);

  // Load documents and consent on mount
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth-token') || '';
        if (!token) return;
        // Documents
        try {
          const dr = await fetch('/api/escort/documents', { headers: { 'Authorization': `Bearer ${token}` } });
          if (dr.ok) {
            const { documents } = await dr.json();
            const mapped = (documents || []).map((d: any) => ({
              id: String(d.id),
              type: d.type,
              url: d.url,
              status: d.status === 'APPROVED' ? 'approvato' : d.status === 'REJECTED' ? 'rifiutato' : 'in_review',
            }));
            setDocs(mapped);
          }
        } catch {}
        // Consent
        try {
          const cr = await fetch('/api/escort/consent', { headers: { 'Authorization': `Bearer ${token}` } });
          if (cr.ok) {
            const j = await cr.json();
            // API restituisce { consentAcceptedAt }
            setConsentAcceptedAt(j?.consentAcceptedAt || null);
          }
        } catch {}
      } catch {}
    })();
  }, []);

  // Upload foto - IDENTICO a incontri-veloci
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string | null;
        if (result) setPhotos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilesUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string | null;
        if (result) setPhotos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (faceIndex === index) setFaceIndex(-1);
    if (faceIndex > index) setFaceIndex(faceIndex - 1);
  };

  const handleSubmit = async () => {
    if (photos.length < 3) {
      alert('Seleziona almeno 3 foto');
      return;
    }

    if (faceIndex === -1) {
      alert('Segna almeno 1 foto come volto');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token') || '';
      if (!token) { alert('Devi essere autenticato'); return; }

      // Helper: converte dataURL in Blob
      const dataURLtoBlob = (dataUrl: string) => {
        if (!dataUrl || !dataUrl.startsWith('data:')) throw new Error('DataURL non valido');
        const arr = dataUrl.split(',');
        if (arr.length < 2) throw new Error('DataURL incompleto');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
      };

      const compressDataUrl = (srcDataUrl: string, maxW = 1200, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            const ratio = img.width > maxW ? maxW / img.width : 1;
            const w = Math.round(img.width * ratio);
            const h = Math.round(img.height * ratio);
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas non supportato'));
            ctx.drawImage(img, 0, 0, w, h);
            const out = canvas.toDataURL('image/jpeg', quality);
            resolve(out);
          };
          img.onerror = () => reject(new Error('Impossibile caricare immagine per compressione'));
          img.src = srcDataUrl;
        });
      };

      // 1) Carica foto UNA PER UNA (prima JSON base64 compresso -> /upload, su prod SOLO JSON) -> DRAFT
      const created: Array<{ id: number; idx: number }> = [];
      for (let idx = 0; idx < photos.length; idx++) {
        let url = photos[idx];
        try {
          // Comprimi per stare sotto i limiti delle serverless (Vercel ~4MB body)
          const isProd = typeof window !== 'undefined' && /vercel\.app$/.test(window.location.hostname);
          const targetW = isProd ? 600 : 1200;
          const targetQ = isProd ? 0.45 : 0.7;
          try { url = await compressDataUrl(url, targetW, targetQ); } catch (e) { console.warn('Compressione fallita', e); }

          // Pre-check dimensione (evita errori su Vercel se troppo grande)
          const estimatedMB = (url.length / 1024 / 1024).toFixed(2);
          console.log(`Foto ${idx+1}: ~${estimatedMB}MB`);
          if (url.length > 2.5 * 1024 * 1024) {
            throw new Error(`Foto troppo grande (~${estimatedMB}MB). Riduci qualità o risoluzione e riprova.`);
          }

          // Primo tentativo: JSON base64 (più compatibile su Vercel)
          const upJson = await fetch('/api/escort/photos/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ url, name: `foto-${idx + 1}.jpg`, size: url.length })
          });
          const uj = await upJson.json().catch(()=>({}));
          if (!upJson.ok || !uj?.photo?.id) {
            console.error('Upload JSON error', upJson.status, uj);
            throw new Error(`Errore upload: ${uj?.error || 'Errore server'} (status ${upJson.status})`);
          }
          created.push({ id: Number(uj.photo.id), idx });
        } catch (e: any) {
          console.error('Upload foto fallito (idx='+idx+')', e);
          alert(`Errore upload foto ${idx+1}: ${e?.message || e}`);
          setSubmitting(false);
          return;
        }
      }

      // 2) Imposta volto su quella scelta
      try {
        const face = created.find(c => c.idx === faceIndex);
        if (face) {
          await fetch('/api/escort/photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id: face.id, isFace: true })
          });
        }
      } catch {}

      // 3) Invio a revisione tutte le DRAFT
      const submitRes = await fetch('/api/escort/photos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ skipValidation: true })
      });
      const submitData = await submitRes.json().catch(()=>({}));
      if (!submitRes.ok) { throw new Error(submitData?.error || 'Invio a revisione fallito'); }

      alert('✅ Foto inviate in revisione con successo!');
      setPhotos([]);
      setFaceIndex(-1);
    } catch (error) {
      console.error('Errore invio foto:', error);
      alert('Errore durante l\'invio delle foto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Verifica Foto" subtitle="Carica almeno 3 foto, segna 1 con volto" />

      {/* Area upload */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-950' : 'border-gray-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="mb-4">Trascina foto qui o clicca per selezionare</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
            ref={photoInputRef}
          />
          <Button
            variant="secondary"
            type="button"
            onClick={() => photoInputRef.current?.click()}
          >
            Seleziona foto
          </Button>
        </div>
      </div>

      {/* Lista foto */}
      {photos.length > 0 && (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
          <div className="font-semibold mb-3">
            Foto caricate: {photos.length} {faceIndex >= 0 ? '✓ Con volto' : '⚠️ Nessun volto'}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="border border-gray-600 rounded-md overflow-hidden">
                <div className="relative w-full h-56 bg-black">
                  <NextImage src={photo} alt={`Foto ${idx + 1}`} fill className="object-contain" />
                  {faceIndex === idx && (
                    <div className="absolute top-2 left-2 text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded">
                      Volto
                    </div>
                  )}
                </div>
                <div className="p-2 flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="px-2 py-1 h-7 text-xs flex-1"
                    onClick={() => removePhoto(idx)}
                  >
                    Rimuovi
                  </Button>
                  <Button 
                    variant="secondary"
                    className={`px-2 py-1 h-7 text-xs flex-1 ${faceIndex === idx ? 'bg-blue-600 text-white' : ''}`}
                    onClick={() => setFaceIndex(faceIndex === idx ? -1 : idx)}
                  >
                    {faceIndex === idx ? 'Rimuovi volto' : 'Segna volto'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sezione Documenti di Identità (ripristino) */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-lg text-white">Documenti di Identità</div>
            <div className="text-sm text-gray-400">Carica i tuoi documenti per la verifica dell'identità</div>
          </div>
          {docs.some(d => d.status === 'approvato') ? (
            <div className="text-xs px-3 py-1 rounded-full bg-green-600 text-green-100">Documento approvato ✓</div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">Obbligatorio per la verifica</div>
          )}
        </div>

        {/* Linee guida documenti */}
        {!docs.some(d => d.status === 'approvato') && (
          <div className="bg-red-50/5 border border-red-600/40 rounded-lg p-4 mb-4">
            <div className="font-semibold text-red-200 mb-2">⚠️ DOCUMENTO D'IDENTITÀ OBBLIGATORIO</div>
            <ul className="text-sm text-red-200/90 list-disc pl-5 space-y-1">
              <li><strong>Carta d'identità fronte e retro</strong> (obbligatorio). In alternativa, passaporto o patente.</li>
              <li><strong>Selfie con documento</strong> vicino al volto (consigliato per velocizzare l'approvazione).</li>
              <li>Formato: JPG o PNG. <strong>Massimo 5MB</strong> per file. Immagini nitide e leggibili.</li>
              <li>Nessun filtro o watermark invasivo. Tutti i dati devono essere visibili.</li>
            </ul>
          </div>
        )}

        {/* Upload documenti */}
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${docs.some(d => d.status==='approvato') ? 'border-green-700 bg-green-900/20' : 'border-gray-600 hover:border-blue-500/60'}`}>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <select
                className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1"
                value={docType}
                onChange={(e)=>setDocType(e.target.value as any)}
              >
                <option value="ID_CARD_FRONT">Carta d'identità - Fronte</option>
                <option value="ID_CARD_BACK">Carta d'identità - Retro</option>
                <option value="SELFIE_WITH_ID">Selfie con documento</option>
              </select>
              <span className="text-xs text-gray-400">Formato: JPG/PNG, max 5MB</span>
            </div>
            <input 
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="document-upload"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                const token = localStorage.getItem('auth-token') || '';
                for (const file of Array.from(files)) {
                  if (!file.type.startsWith('image/')) { alert(`File "${file.name}" non è un'immagine valida`); continue; }
                  if (file.size > 5*1024*1024) { alert(`File "${file.name}" troppo grande (max 5MB)`); continue; }
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('type', docType);
                  try {
                    const res = await fetch('/api/escort/documents/upload', { method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : undefined, body: fd });
                    const j = await res.json().catch(()=>({}));
                    if (!res.ok) { alert(j?.error || 'Errore caricamento documento'); continue; }
                    // Append nuovo doc in stato in_review
                    setDocs(prev => [...prev, { id: String(j?.document?.id || Date.now()), type: docType, url: j?.document?.url || '', status: 'in_review' }]);
                  } catch (err) { console.error('Upload documento errore:', err); alert('Errore rete durante upload documento'); }
                }
                e.currentTarget.value = '';
              }}
            />
            <label htmlFor="document-upload" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors font-medium">
              Seleziona Documenti
            </label>
          </div>
        </div>

        {/* Lista documenti */}
        {docs.length > 0 && (
          <div className="mt-4">
            <div className="font-medium mb-3 text-white">Documenti Caricati ({docs.length})</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {docs.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-3 bg-gray-700/50 border-gray-600">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={doc.url?.startsWith('/uploads/') ? ('/api'+doc.url) : doc.url} alt={doc.type} className="w-20 h-14 object-cover rounded-md border border-gray-600" onError={(e)=>{ const t=e.currentTarget as HTMLImageElement; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }} />
                      <div>
                        <div className="font-medium text-sm text-white">{doc.type}</div>
                        <div className="text-xs text-gray-400">Documento di identità</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${doc.status === 'approvato' ? 'bg-green-100 text-green-700' : doc.status === 'rifiutato' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {doc.status === 'approvato' ? 'Approvato' : doc.status === 'rifiutato' ? 'Rifiutato' : 'In Revisione'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Consenso legale (ripristino) */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-2 text-white">Consenso legale all'utilizzo di immagini e video</div>
        <p className="text-sm text-gray-300 mb-2">Leggi attentamente il documento di liberatoria prima di procedere:</p>
        <div className="flex flex-col gap-1">
          <a href="/docs/Liberatoria.pdf" target="_blank" className="inline-block text-blue-400 underline text-sm" rel="noopener noreferrer">Apri il documento di consenso (PDF)</a>
          <a href="/consenso-legale" target="_blank" className="inline-block text-gray-400 underline text-xs" rel="noopener noreferrer">Oppure leggi la versione online</a>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={!!consentAcceptedAt || consentTick} onChange={(e)=>setConsentTick(e.target.checked)} disabled={!!consentAcceptedAt} />
            <span>Ho letto e accetto quanto sopra</span>
          </label>
          {!consentAcceptedAt && (
            <Button disabled={!consentTick || consentSaving} onClick={async()=>{
              if (!consentTick) return;
              try {
                setConsentSaving(true);
                const token = localStorage.getItem('auth-token') || '';
                const res = await fetch('/api/escort/consent', { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
                if (res.ok) {
                  const data = await res.json().catch(()=>({}));
                  setConsentAcceptedAt(data?.consentAcceptedAt || new Date().toISOString());
                  alert('Consenso registrato con successo');
                } else {
                  const err = await res.json().catch(()=>({ error: 'Errore' }));
                  alert(err?.error || 'Errore registrazione consenso');
                }
              } finally { setConsentSaving(false); }
            }}>{consentSaving ? 'Salvataggio…' : 'Conferma consenso'}</Button>
          )}
          {consentAcceptedAt && <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">Consenso registrato</span>}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting || photos.length < 3 || faceIndex === -1}
        >
          {submitting ? 'Invio in corso...' : 'Invia a revisione'}
        </Button>
      </div>
    </div>
  );
}
