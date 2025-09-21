"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function VerificaFotoPage() {
  type PhotoItem = { id: string; name: string; url: string; size: number; status: "bozza" | "in_review" | "approvata" | "rifiutata" };
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  type DocItem = { id: string; type: 'ID_CARD_FRONT' | 'ID_CARD_BACK' | 'SELFIE_WITH_ID'; url: string; status: 'in_review' | 'approvato' | 'rifiutato' };
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docUrl, setDocUrl] = useState("");
  const [docType, setDocType] = useState<'ID_CARD_FRONT' | 'ID_CARD_BACK' | 'SELFIE_WITH_ID'>('ID_CARD_FRONT');
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null>(null);
  const [consentTick, setConsentTick] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);

  // Carica/salva bozza in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("escort-verify-photos");
      if (raw) setPhotos(JSON.parse(raw));
    } catch {}
    // Carica anche da API
    (async () => {
      try {
        const res = await fetch('/api/escort/photos');
        if (res.ok) {
          const { photos } = await res.json();
          if (Array.isArray(photos)) {
            const mapped: PhotoItem[] = photos.map((p: any) => ({
              id: String(p.id),
              name: p.name,
              url: p.url,
              size: p.size,
              status: p.status === 'APPROVED' ? 'approvata' : p.status === 'REJECTED' ? 'rifiutata' : p.status === 'IN_REVIEW' ? 'in_review' : 'bozza',
            }));
            setPhotos((prev) => {
              // unisci evitando duplicati per id
              const byId: Record<string, PhotoItem> = {};
              [...prev, ...mapped].forEach(ph => { byId[ph.id] = ph; });
              return Object.values(byId);
            });
          }
        }
      } catch {}
    })();
    // Carica documenti
    (async () => {
      try {
        const res = await fetch('/api/escort/documents');
        if (res.ok) {
          const { documents } = await res.json();
          const mapped: DocItem[] = (documents || []).map((d: any) => ({
            id: String(d.id),
            type: d.type,
            url: d.url,
            status: d.status === 'APPROVED' ? 'approvato' : d.status === 'REJECTED' ? 'rifiutato' : 'in_review',
          }));
          setDocs(mapped);
        }
      } catch {}
    })();
    // Carica stato consenso legale
    (async () => {
      try {
        const res = await fetch('/api/escort/consent');
        if (res.ok) {
          const data = await res.json();
          setConsentAcceptedAt(data?.consentAcceptedAt || null);
        }
      } catch {}
    })();
  }, []);
  useEffect(() => {
    try { localStorage.setItem("escort-verify-photos", JSON.stringify(photos)); } catch {}
  }, [photos]);

  const onSelectFiles = async (files: FileList | null) => {
    if (!files) return;
    const newItems: PhotoItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      // anteprima locale immediata
      const tempUrl = URL.createObjectURL(file);
      const tempId = `${file.name}-${file.size}-${Date.now()}`;
      const tempItem: PhotoItem = { id: tempId, name: file.name, url: tempUrl, size: file.size, status: "bozza" };
      newItems.push(tempItem);
      // upload reale
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/escort/photos/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const { photo } = await res.json();
          // aggiorna l'elemento con id/url reali
          setPhotos((prev) => prev.map(p => p.id === tempId ? { ...p, id: String(photo.id), url: photo.url, size: photo.size ?? p.size } : p));
        }
      } catch {}
    }
    if (newItems.length) setPhotos((prev) => [...prev, ...newItems]);
  };

  const removePhoto = async (id: string) => {
    setPhotos((prev) => prev.filter(p => p.id !== id));
    try { await fetch('/api/escort/photos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(id) }) }); } catch {}
  };
  const sendForReview = async () => {
    setSubmitting(true);
    try {
      const drafts = photos.filter(p => p.status === 'bozza');
      await Promise.all(drafts.map(async (p) => {
        const idNum = Number(p.id);
        if (Number.isNaN(idNum)) return;
        try {
          await fetch('/api/escort/photos/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: idNum, action: 'in_review' }) });
        } catch {}
      }));
      setPhotos((prev) => prev.map(p => p.status === 'bozza' ? { ...p, status: 'in_review' } : p));
      alert("Foto inviate per verifica. Riceverai un aggiornamento appena possibile.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = useMemo(() => photos.some(p => p.status === "bozza"), [photos]);
  const hasAnyDoc = docs.length > 0;
  const hasConsent = !!consentAcceptedAt;

  return (
    <div className="space-y-6">
      <SectionHeader title="Verifica Foto al 100%" subtitle="Carica e verifica le tue foto per aumentare la fiducia" />

      {/* Linee guida */}
      <div className="rounded-lg border bg-white p-4">
        <div className="font-semibold mb-2">Linee Guida</div>
        <ul className="text-sm text-neutral-700 list-disc pl-5 space-y-1">
          <li>Carica immagini nitide, senza watermark invadenti, in cui tu sia presente.</li>
          <li>Formati supportati: JPG/PNG, fino a 5MB per immagine.</li>
          <li>Evita collage, testo eccessivo e foto duplicate.</li>
          <li>Privilegiamo foto in cui il volto sia visibile o in alternativa segni distintivi.</li>
        </ul>
      </div>

      {/* (Spostata in fondo) Consenso legale - renderizzato più in basso */}

      {/* Uploader */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Carica Foto</div>
          <div className="text-xs text-neutral-500">Drag & Drop non supportato: usa il bottone qui sotto</div>
        </div>
        <div className="flex items-center gap-3">
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onSelectFiles(e.target.files)} />
          <Button onClick={() => inputRef.current?.click()}>Seleziona immagini</Button>
          <Button variant="secondary" onClick={() => setPhotos([])}>Svuota bozza</Button>
        </div>
      </div>

      {/* Lista foto */}
      <div className="rounded-lg border bg-white p-4">
        <div className="font-semibold mb-3">Le tue foto ({photos.length})</div>
        {photos.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessuna foto caricata. Aggiungi immagini per inviarle in verifica.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <div key={p.id} className="border rounded-md overflow-hidden bg-white">
                <div className="relative w-full h-56 bg-neutral-100">
                  <Image src={p.url} alt={p.name} fill className="object-cover" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium truncate max-w-[180px]" title={p.name}>{p.name}</div>
                    <div className="text-xs text-neutral-500">{Math.round(p.size / 1024)} KB</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'approvata' ? 'bg-green-100 text-green-700' : p.status === 'rifiutata' ? 'bg-red-100 text-red-700' : p.status === 'in_review' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-700'}`}>
                      {p.status === 'bozza' ? 'Bozza' : p.status === 'in_review' ? 'In revisione' : p.status === 'approvata' ? 'Approvata' : 'Rifiutata'}
                    </span>
                    {p.status === 'bozza' && (
                      <Button variant="secondary" onClick={() => removePhoto(p.id)}>Rimuovi</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consenso legale (obbligatorio) - in fondo */}
      <div className="rounded-lg border bg-white p-4">
        <div className="font-semibold mb-2">Consenso legale all'utilizzo di immagini e video</div>
        <p className="text-sm text-neutral-700 mb-2">
          Leggi attentamente il documento di liberatoria prima di procedere:
        </p>
        <div className="flex flex-col gap-1">
          <a href="/docs/liberatoria.pdf" target="_blank" className="inline-block text-blue-600 underline text-sm" rel="noopener noreferrer">
            Apri il documento di consenso (PDF)
          </a>
          <a href="/consenso-legale" target="_blank" className="inline-block text-neutral-600 underline text-xs" rel="noopener noreferrer">
            Oppure leggi la versione online
          </a>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasConsent || consentTick} onChange={(e)=>setConsentTick(e.target.checked)} disabled={hasConsent} />
            <span>Ho letto e accetto quanto sopra</span>
          </label>
          {!hasConsent && (
            <Button disabled={!consentTick || consentSaving} onClick={async()=>{
              if (!consentTick) return;
              try {
                setConsentSaving(true);
                const res = await fetch('/api/escort/consent', { method: 'PATCH' });
                if (res.ok) {
                  const data = await res.json();
                  setConsentAcceptedAt(data?.consentAcceptedAt || new Date().toISOString());
                  alert('Consenso registrato. Puoi procedere.');
                } else {
                  alert('Non è stato possibile registrare il consenso. Riprova.');
                }
              } finally {
                setConsentSaving(false);
              }
            }}>{consentSaving ? 'Salvataggio…' : 'Conferma consenso'}</Button>
          )}
          {hasConsent && <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">Consenso registrato</span>}
        </div>
      </div>

      {/* Invio per verifica */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="secondary"
          onClick={async () => {
            const inReview = photos.filter(p => p.status === 'in_review');
            await Promise.all(inReview.map(async (p) => {
              const idNum = Number(p.id);
              if (Number.isNaN(idNum)) return;
              try {
                await fetch('/api/escort/photos/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: idNum, action: 'draft' }) });
              } catch {}
            }));
            setPhotos((prev) => prev.map(p => p.status === 'in_review' ? { ...p, status: 'bozza' } : p));
          }}
        >
          Ritira dalla revisione
        </Button>
        <Button onClick={sendForReview} disabled={!canSubmit || submitting || !hasAnyDoc} title={!hasAnyDoc ? 'Carica almeno un documento prima di inviare' : ''}>{submitting ? 'Invio…' : 'Invia a verifica'}</Button>
      </div>
    </div>
  );
}
