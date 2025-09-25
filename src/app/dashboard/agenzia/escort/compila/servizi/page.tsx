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
  const [services, setServices] = useState<any>({ general: [], extra: [], fetish: [], virtual: [] });

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/agency/escort/servizi?escortUserId=${escortUserId}`, { credentials: 'include' });
        if (res.ok) {
          const j = await res.json();
          const s = j.services || {};
          setServices({
            general: Array.isArray(s.general) ? s.general : [],
            extra: Array.isArray(s.extra) ? s.extra : [],
            fetish: Array.isArray(s.fetish) ? s.fetish : [],
            virtual: Array.isArray(s.virtual) ? s.virtual : [],
          });
        }
      } finally { setLoading(false); }
    })();
  }, [escortUserId]);

  function toggle(cat: string, name: string) {
    setServices((prev: any) => {
      const list: string[] = Array.isArray(prev[cat]) ? prev[cat] : [];
      const next = list.includes(name) ? list.filter((x) => x !== name) : [...list, name];
      return { ...prev, [cat]: next };
    });
  }

  async function save() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/agency/escort/servizi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ escortUserId, services })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore salvataggio'); }
      else { alert('Servizi salvati'); }
    } finally { setSaving(false); }
  }

  const CATS: Array<{ key: keyof typeof services; label: string; items: string[] }> = [
    { key: 'general', label: 'Servizi Generali', items: ['Massaggio', 'Bacio', '69', 'Orale', 'GFE'] },
    { key: 'extra', label: 'Extra', items: ['Coppie', 'Doppio', 'Rim', 'Anal', 'Roleplay'] },
    { key: 'fetish', label: 'Fetish', items: ['Foot', 'Latex', 'Dominazione', 'BDSM light'] },
    { key: 'virtual', label: 'Virtual', items: ['Videochiamata', 'Chat Hot', 'Foto personalizzate'] },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Servizi (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-6">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <>
            {CATS.map(cat => (
              <div key={String(cat.key)}>
                <div className="text-white font-semibold mb-2">{cat.label}</div>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map(it => (
                    <button key={it} type="button" onClick={()=> toggle(cat.key as any, it)} className={`text-xs px-3 py-1 rounded border ${services[cat.key]?.includes(it) ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>{it}</button>
                  ))}
                </div>
              </div>
            ))}
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
