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

      {/* Sezione Documenti di Identità */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-lg">Documenti di Identità</div>
            <div className="text-sm text-neutral-600">Carica i tuoi documenti per la verifica dell'identità</div>
          </div>
          <div className="text-xs text-neutral-500 bg-neutral-50 px-3 py-1 rounded-full">
            Obbligatorio per la verifica
          </div>
        </div>

        {/* Linee guida documenti */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="font-medium text-red-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            CARTA D'IDENTITÀ OBBLIGATORIA
          </div>
          <div className="bg-white border border-red-300 rounded p-3 mb-3">
            <p className="text-red-800 font-semibold text-sm mb-2">⚠️ DOCUMENTO RICHIESTO</p>
            <p className="text-red-700 text-xs">
              È OBBLIGATORIO caricare la carta d'identità (fronte e retro) per poter utilizzare il sito.
              Senza questo documento non potrai pubblicare annunci o accedere alle funzionalità avanzate.
            </p>
          </div>
          <ul className="text-sm text-red-800 list-disc pl-5 space-y-1">
            <li><strong>CARTA D'IDENTITÀ (fronte e retro) - OBBLIGATORIO</strong></li>
            <li>Patente di guida (fronte e retro) - opzionale</li>
            <li>Passaporto (pagina con foto) - opzionale</li>
            <li>Formato: JPG/PNG, massimo 5MB per file</li>
            <li>Immagini nitide e leggibili, senza riflessi</li>
            <li>Tutti i dati devono essere chiaramente visibili</li>
          </ul>
        </div>

        {/* Upload documenti */}
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-neutral-900">Carica i tuoi documenti</div>
              <div className="text-sm text-neutral-600">Clicca per selezionare i file o trascinali qui</div>
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
                
                for (const file of Array.from(files)) {
                  // Validazione lato client
                  if (!file.type.startsWith("image/")) {
                    alert(`File "${file.name}" non è un'immagine valida. Solo JPG e PNG sono accettati.`);
                    continue;
                  }
                  
                  if (file.size > 5 * 1024 * 1024) {
                    alert(`File "${file.name}" è troppo grande. Massimo 5MB.`);
                    continue;
                  }
                  
                  if (file.size < 10 * 1024) {
                    alert(`File "${file.name}" è troppo piccolo. Minimo 10KB.`);
                    continue;
                  }
                  
                  // Mostra preview temporaneo
                  const tempUrl = URL.createObjectURL(file);
                  const tempDoc: DocItem = {
                    id: `temp-${Date.now()}`,
                    type: 'ID_CARD_FRONT', // Tipo temporaneo
                    url: tempUrl,
                    status: 'in_review'
                  };
                  setDocs(prev => [...prev, tempDoc]);
                  
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('type', 'identity');
                    
                    const res = await fetch('/api/escort/documents/upload', { 
                      method: 'POST', 
                      body: fd 
                    });
                    
                    const data = await res.json();
                    
                    if (res.ok) {
                      // Sostituisci il documento temporaneo con quello reale
                      setDocs(prev => prev.map(doc => 
                        doc.id === tempDoc.id ? {
                          id: String(data.document.id),
                          type: 'ID_CARD_FRONT' as const,
                          url: data.document.url,
                          status: 'in_review' as const
                        } : doc
                      ));
                    } else {
                      // Rimuovi il documento temporaneo e mostra errore
                      setDocs(prev => prev.filter(doc => doc.id !== tempDoc.id));
                      alert(`Errore caricamento "${file.name}": ${data.error || 'Errore sconosciuto'}`);
                    }
                  } catch (error) {
                    // Rimuovi il documento temporaneo e mostra errore
                    setDocs(prev => prev.filter(doc => doc.id !== tempDoc.id));
                    console.error('Errore upload documento:', error);
                    alert(`Errore di rete durante il caricamento di "${file.name}"`);
                  }
                }
                
                // Reset input
                e.target.value = '';
              }}
            />
            <label 
              htmlFor="document-upload" 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors font-medium"
            >
              Seleziona Documenti
            </label>
          </div>
        </div>

        {/* Lista documenti caricati */}
        {docs.length > 0 && (
          <div className="mt-4">
            <div className="font-medium mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Documenti Caricati ({docs.length})
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {docs.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-3 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{doc.type}</div>
                        <div className="text-xs text-neutral-600">Documento di identità</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        doc.status === 'approvato' ? 'bg-green-100 text-green-700' : 
                        doc.status === 'rifiutato' ? 'bg-red-100 text-red-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.status === 'approvato' ? 'Approvato' : doc.status === 'rifiutato' ? 'Rifiutato' : 'In Revisione'}
                      </span>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messaggio se nessun documento */}
        {docs.length === 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Documenti richiesti</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Devi caricare almeno un documento di identità per poter inviare le foto a verifica.
            </p>
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
