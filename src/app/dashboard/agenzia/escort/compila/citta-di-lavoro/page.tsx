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
  const [baseCity, setBaseCity] = useState("");
  const [secondCity, setSecondCity] = useState("");
  const [thirdCity, setThirdCity] = useState("");
  const [fourthCity, setFourthCity] = useState("");
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch(`/api/agency/escort/citta?escortUserId=${escortUserId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const j = await res.json();
          const c = j.cities || {};
          setBaseCity(c.baseCity || "");
          setSecondCity(c.secondCity || "");
          setThirdCity(c.thirdCity || "");
          setFourthCity(c.fourthCity || "");
          setZones(Array.isArray(c.zones) ? c.zones : []);
        }
      } finally { setLoading(false); }
    })();
  }, [escortUserId]);

  async function save() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/agency/escort/citta', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ escortUserId, baseCity, secondCity, thirdCity, fourthCity, zones })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore salvataggio'); }
      else { alert('Città salvate'); }
    } finally { setSaving(false); }
  }

  function toggleZone(z: string) {
    setZones(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]);
  }

  const allZones = ["Centro","Stazione","Aeroporto","Porto","Periferia"];

  return (
    <div className="space-y-6">
      <SectionHeader title="Città di Lavoro (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 text-gray-300">Città principale</label>
                <input value={baseCity} onChange={(e)=> setBaseCity(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-300">Seconda città</label>
                <input value={secondCity} onChange={(e)=> setSecondCity(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-300">Terza città</label>
                <input value={thirdCity} onChange={(e)=> setThirdCity(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-300">Quarta città</label>
                <input value={fourthCity} onChange={(e)=> setFourthCity(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-300">Zone</label>
              <div className="flex flex-wrap gap-2">
                {allZones.map(z => (
                  <button key={z} type="button" onClick={()=> toggleZone(z)} className={`text-xs px-3 py-1 rounded border ${zones.includes(z) ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>{z}</button>
                ))}
              </div>
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
