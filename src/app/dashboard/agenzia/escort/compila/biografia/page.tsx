"use client";

import SectionHeader from "@/components/SectionHeader";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function Inner() {
  const params = useSearchParams();
  const escortUserId = Number(params.get("escortUserId"));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bioIt, setBioIt] = useState("");
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/agency/escort/biografia?escortUserId=${escortUserId}`, { credentials: 'include' });
        if (res.ok) {
          const j = await res.json();
          setBioIt(j.bioIt || "");
          setInfo(j.info || null);
        }
      } finally { setLoading(false); }
    })();
  }, [escortUserId]);

  async function save() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/agency/escort/biografia', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ escortUserId, bioIt, info })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore salvataggio'); }
      else { alert('Biografia salvata'); }
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Biografia (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <>
            <div>
              <label className="block text-xs mb-1 text-gray-300">Testo Biografia (IT)</label>
              <textarea value={bioIt} onChange={(e)=> setBioIt(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full min-h-[180px] placeholder-gray-400" placeholder="Scrivi qui la biografia in italiano" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-300">Note interne (opzionale)</label>
              <textarea value={info || ''} onChange={(e)=> setInfo(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full min-h-[100px] placeholder-gray-400" placeholder="Note interne (non visibili pubblicamente)" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <a href="/dashboard/agenzia/escort" className="text-sm text-blue-400 hover:underline">« Torna a Gestione Escort</a>
              <Button onClick={save} disabled={saving || !escortUserId}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AgencyEscortBioPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Caricamento…</div>}>
      <Inner />
    </Suspense>
  );
}
