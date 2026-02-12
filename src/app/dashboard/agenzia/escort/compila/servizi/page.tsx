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
  const [services, setServices] = useState<any>({ general: [], extra: [] });

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
        const res = await fetch(`/api/agency/escort/servizi?escortUserId=${escortUserId}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const j = await res.json();
          const s = j.services || {};
          setServices({
            general: Array.isArray(s.general) ? s.general : [],
            extra: Array.isArray(s.extra) ? s.extra : [],
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
      const res = await fetch('/api/agency/escort/servizi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ escortUserId, services })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore salvataggio'); }
      else { alert('Servizi salvati'); }
    } finally { setSaving(false); }
  }

  const CATS: Array<{ key: keyof typeof services; label: string; items: string[] }> = [
    { 
      key: 'general', 
      label: 'Servizi Generali', 
      items: [
        'Girlfriend Experience (GFE)', 'Bacio alla Francese', 'Dildo Play / Toys', '69 posizione', 
        'Sesso anale', 'Venuta in bocca', 'Venuta sulla faccia', 'Massaggio rilassante', 
        'Disponibile a domicilio (outcall)', 'Disponibile in appartamento (incall)', 'Doccia insieme', 
        'Sesso orale', 'Sesso orale senza (OWO)', 'Porn Star Experience (PSE)', 'Baci senza', 
        'Disponibile per coppie', 'Disponibile per duo', 'Role play', 'Lingerie / Costumi', 'Consentito foto/video'
      ] 
    },
    { 
      key: 'extra', 
      label: 'Servizi Extra', 
      items: [
        'Leccare e succhiare le palle', 'Gola Profonda', 'Discorso Sporco', 'Doppia penetrazione', 
        'Extraball', 'Seduta in faccia', 'Fisting', 'Massaggio sensuale su tutto il corpo', 
        'Gangbang', 'Kamasutra', 'Bukkake', 'Ingoio', 'Sborra sul seno', 'Sborra sul sedere', 
        'Bondage', 'BDSM', 'Clinic Sex', 'Feticismo', 'Feticismo dei piedi', 
        'Pioggia dorata (dare)', 'Pioggia dorata (ricevere)', 'Pelle / Lattice / PVC', 
        'Padrona (hard)', 'Padrona (soft)', 'Gioco di Ruolo e Fantasia', 'Sculacciata (dare)', 
        'Sculacciata (ricevere)', 'Strap on', 'Sottomesso / Schiavo (hard)', 'Sottomesso / Schiavo (soft)', 
        'Squirting', 'Costumi / Uniformi'
      ] 
    }
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
