"use client";

import SectionHeader from "@/components/SectionHeader";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function Inner() {
  const params = useSearchParams();
  const escortUserId = Number(params?.get("escortUserId") || 0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState<any>({});

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch(`/api/agency/escort/orari?escortUserId=${escortUserId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const j = await res.json();
          setWorkingHours(j.workingHours || {});
        }
      } finally { setLoading(false); }
    })();
  }, [escortUserId]);

  function setDay(d: string, field: 'from' | 'to', value: string) {
    setWorkingHours((prev: any) => ({ ...prev, [d]: { ...(prev?.[d] || {}), [field]: value } }));
  }

  async function save() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/agency/escort/orari', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ escortUserId, workingHours })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore salvataggio'); }
      else { alert('Orari salvati'); }
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Orari (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-6">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {DAYS.map(d => (
              <div key={d} className="flex items-center gap-2">
                <div className="w-16 text-gray-300 text-sm">{d}</div>
                <input type="time" value={workingHours?.[d]?.from || ''} onChange={(e)=> setDay(d,'from',e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2" />
                <span className="text-gray-400">—</span>
                <input type="time" value={workingHours?.[d]?.to || ''} onChange={(e)=> setDay(d,'to',e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2" />
              </div>
            ))}
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
