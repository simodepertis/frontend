"use client";

import SectionHeader from "@/components/SectionHeader";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const TYPES = [
  { key: "ID_CARD_FRONT", label: "Carta d'identità (Fronte)" },
  { key: "ID_CARD_BACK", label: "Carta d'identità (Retro)" },
  { key: "SELFIE_WITH_ID", label: "Selfie con documento" },
];

function Inner() {
  const params = useSearchParams();
  const escortUserId = Number(params?.get("escortUserId") || 0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<Array<any>>([]);

  const [type, setType] = useState<string>(TYPES[0].key);
  const [url, setUrl] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/agency/escort/documenti?escortUserId=${escortUserId}`, { credentials: 'include' });
      if (res.ok) {
        const j = await res.json();
        setDocuments(Array.isArray(j.documents) ? j.documents : []);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { if (escortUserId) load(); else setLoading(false); }, [escortUserId]);

  async function add() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    if (!url) { alert('Inserisci URL del documento'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/agency/escort/documenti', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ escortUserId, type, url })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore invio documento'); }
      else { setUrl(''); await load(); }
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm('Eliminare questo documento?')) return;
    const res = await fetch('/api/agency/escort/documenti', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ escortUserId, id }) });
    if (res.ok) await load(); else alert('Errore eliminazione');
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Documenti (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <select value={type} onChange={(e)=> setType(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2">
            {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <input value={url} onChange={(e)=> setUrl(e.target.value)} placeholder="URL documento" className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
          <Button onClick={add} disabled={saving || !url}>{saving ? 'Invio…' : 'Invia documento'}</Button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {documents.map((d) => (
              <div key={d.id} className="border border-gray-600 rounded-md overflow-hidden bg-gray-900">
                <div className="aspect-[3/2] bg-gray-800 flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                  <div className="truncate w-full">{d.url}</div>
                </div>
                <div className="p-2 text-xs text-gray-300 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{d.type}</div>
                    <span className={`px-2 py-0.5 rounded ${d.status === 'IN_REVIEW' ? 'bg-yellow-700 text-yellow-200' : d.status === 'APPROVED' ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'}`}>{d.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-400">#{d.id}</div>
                    <button className="text-red-300 hover:text-red-400" onClick={()=> del(d.id)}>Elimina</button>
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
