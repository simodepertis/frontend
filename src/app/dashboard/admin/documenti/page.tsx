"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// Nota: per anteprime documenti usiamo <img> al posto di next/image
// per evitare problemi di domini esterni/signed URL non whitelisted.

export default function AdminDocumentiPage() {
  type Document = { 
    id: number; 
    userId: number; 
    userName: string; 
    userEmail: string; 
    type: string; 
    status: string; 
    url: string; 
    createdAt: string; 
  };
  
  const [status, setStatus] = useState<'IN_REVIEW' | 'APPROVED' | 'REJECTED'>('IN_REVIEW');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const r = await fetch(`/api/admin/documents?status=${status}`, { headers });
      if (r.ok) {
        const j = await r.json();
        setDocuments(j.documents || []);
      } else {
        setDocuments([]);
      }
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { load(); }, [status]);

  async function act(id: number, action: 'approve'|'reject') {
    setActingId(id);
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      };
      
      const r = await fetch('/api/admin/documents', { 
        method: 'PATCH', 
        headers, 
        body: JSON.stringify({ documentId: id, action }) 
      });
      const j = await r.json();
      if (!r.ok) { 
        alert(j?.error || 'Errore'); 
        return; 
      }
      await load();
    } finally { 
      setActingId(null); 
    }
  }

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'ID_CARD_FRONT': return 'Carta ID (Fronte)';
      case 'ID_CARD_BACK': return 'Carta ID (Retro)';
      case 'SELFIE_WITH_ID': return 'Selfie con ID';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Moderazione Documenti" subtitle="Approva o rifiuta documenti di identità caricati dagli utenti" />

      <div className="flex items-center gap-2">
        <select className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
          <option value="IN_REVIEW">In revisione</option>
          <option value="APPROVED">Approvati</option>
          <option value="REJECTED">Rifiutati</option>
        </select>
        <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Aggiorno…' : 'Ricarica'}</Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-sm text-gray-400">Nessun documento</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {documents.map(doc => (
            <div key={doc.id} className="border border-gray-600 rounded-md overflow-hidden bg-gray-800">
              <div className="relative w-full aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.url?.startsWith('/uploads/') ? ('/api' + doc.url) : doc.url}
                  alt={`Documento ${doc.id}`}
                  className="object-cover absolute inset-0 w-full h-full"
                  onError={(e)=>{ const t=e.currentTarget as HTMLImageElement; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }}
                />
                <a
                  href={doc.url?.startsWith('/uploads/') ? ('/api' + doc.url) : doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-black/60 hover:bg-black/80 text-white border border-white/20"
                  title="Apri in nuova scheda"
                >
                  Apri
                </a>
              </div>
              <div className="p-3">
                <div className="text-sm text-white font-semibold">{getTypeLabel(doc.type)}</div>
                <div className="text-xs text-gray-300 mt-1">
                  {doc.userName} ({doc.userEmail})
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Caricato: {doc.createdAt}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    doc.status==='APPROVED'?'bg-green-600 text-green-100':
                    doc.status==='REJECTED'?'bg-red-600 text-red-100':
                    'bg-amber-600 text-amber-100'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                {status === 'IN_REVIEW' && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button 
                      className="h-8 bg-green-600 hover:bg-green-700 flex-1" 
                      onClick={()=>act(doc.id,'approve')} 
                      disabled={actingId===doc.id}
                    >
                      {actingId===doc.id?'…':''} Approva
                    </Button>
                    <Button 
                      className="h-8 bg-red-600 hover:bg-red-700 flex-1" 
                      onClick={()=>act(doc.id,'reject')} 
                      disabled={actingId===doc.id}
                    >
                      Rifiuta
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
