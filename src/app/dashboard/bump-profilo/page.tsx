"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function BumpProfiloPage() {
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch('/API/user/me');
        if (me.ok) {
          const j = await me.json();
          const s = j?.user?.slug;
          if (s) {
            setSlug(s);
            const pub = await fetch(`/API/public/escort/${s}`);
            if (pub.ok) { const pj = await pub.json(); setUpdatedAt(pj?.updatedAt || null); }
          }
        }
      } catch {}
    })();
  }, []);

  async function doBump() {
    setLoading(true);
    try {
      const res = await fetch('/API/me/profile/bump', { method: 'PATCH' });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore bump'); return; }
      setUpdatedAt(j.updatedAt || new Date().toISOString());
    } finally { setLoading(false); }
  }
  return (
    <div className="space-y-6">
      <SectionHeader title="Bump Profilo" subtitle="Rimetti in alto il tuo profilo nelle liste" />
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm text-neutral-700">Ultimo aggiornamento profilo: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</div>
        <div className="mt-3 flex items-center gap-3">
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={doBump} disabled={loading}>{loading ? 'Bumping…' : 'Bump ora'}</Button>
          {slug && <a href={`/escort/${slug}`} target="_blank" className="text-sm text-blue-700 hover:underline">Vedi profilo</a>}
        </div>
        <div className="mt-2 text-xs text-neutral-500">Suggerimento: usa il bump dopo aver caricato nuove foto o aggiornato i dettagli per massima visibilità.</div>
      </div>
    </div>
  );
}
