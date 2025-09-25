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
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/agency/escort/lingue?escortUserId=${escortUserId}`, { credentials: 'include' });
        if (res.ok) {
          const j = await res.json();
          setLanguages(Array.isArray(j.languages) ? j.languages : []);
        }
      } finally { setLoading(false); }
    })();
  }, [escortUserId]);

  async function save() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/agency/escort/lingue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ escortUserId, languages })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore salvataggio'); }
      else { alert('Lingue salvate'); }
    } finally { setSaving(false); }
  }

  function toggle(l: string) {
    setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  }

  const all = ["Italiano","Inglese","Francese","Spagnolo","Tedesco","Russo","Portoghese"];

  return (
    <div className="space-y-6">
      <SectionHeader title="Lingue (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {all.map(l => (
                <button key={l} type="button" onClick={()=> toggle(l)} className={`text-xs px-3 py-1 rounded border ${languages.includes(l) ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <a href={`/dashboard/agenzia/escort/compila?escortUserId=${escortUserId}`} className="text-sm text-blue-400 hover:underline">« Torna all'hub</a>
              <Button onClick={save} disabled={saving || !escortUserId}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
            </div>
          </>
        )}
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
