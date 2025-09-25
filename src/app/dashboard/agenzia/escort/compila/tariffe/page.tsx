"use client";

import SectionHeader from "@/components/SectionHeader";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const DURATIONS = [30, 60, 90, 120];

function Inner() {
  const params = useSearchParams();
  const escortUserId = Number(params?.get("escortUserId") || 0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incall, setIncall] = useState<Array<{ min: number; price: number }>>([]);
  const [outcall, setOutcall] = useState<Array<{ min: number; price: number }>>([]);

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/agency/escort/tariffe?escortUserId=${escortUserId}`, { credentials: 'include' });
        if (res.ok) {
          const j = await res.json();
          const rates = j.rates || { incall: [], outcall: [] };
          setIncall(Array.isArray(rates.incall) ? rates.incall : []);
          setOutcall(Array.isArray(rates.outcall) ? rates.outcall : []);
        }
      } finally { setLoading(false); }
    })();
  }, [escortUserId]);

  function onChange(listName: 'incall' | 'outcall', min: number, price: number) {
    const update = (list: Array<{ min: number; price: number }>) => {
      const idx = list.findIndex(x => x.min === min);
      const next = [...list];
      if (price > 0) {
        if (idx >= 0) next[idx] = { min, price };
        else next.push({ min, price });
      } else {
        if (idx >= 0) next.splice(idx, 1);
      }
      return next.sort((a, b) => a.min - b.min);
    };
    if (listName === 'incall') setIncall(prev => update(prev));
    else setOutcall(prev => update(prev));
  }

  async function save() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/agency/escort/tariffe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ escortUserId, incall, outcall })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore salvataggio'); }
      else { alert('Tariffe salvate'); }
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Tariffe (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-6">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-white font-semibold mb-2">Incall</div>
              <div className="space-y-2">
                {DURATIONS.map(min => {
                  const current = incall.find(x => x.min === min)?.price || 0;
                  return (
                    <div key={min} className="flex items-center gap-3">
                      <div className="w-24 text-gray-300 text-sm">{min} min</div>
                      <input type="number" min={0} step={10} defaultValue={current} onChange={(e)=> onChange('incall', min, Number(e.target.value))} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-40" placeholder="Prezzo €" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-2">Outcall</div>
              <div className="space-y-2">
                {DURATIONS.map(min => {
                  const current = outcall.find(x => x.min === min)?.price || 0;
                  return (
                    <div key={min} className="flex items-center gap-3">
                      <div className="w-24 text-gray-300 text-sm">{min} min</div>
                      <input type="number" min={0} step={10} defaultValue={current} onChange={(e)=> onChange('outcall', min, Number(e.target.value))} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-40" placeholder="Prezzo €" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <a href={`/dashboard/agenzia/escort/compila?escortUserId=${escortUserId}`} className="text-sm text-blue-400 hover:underline">« Torna all'hub</a>
          <Button onClick={save} disabled={saving || !escortUserId}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
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
