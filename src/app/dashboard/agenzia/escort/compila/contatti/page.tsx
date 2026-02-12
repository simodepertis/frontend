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
  const [phone, setPhone] = useState("");
  const [apps, setApps] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [emailBooking, setEmailBooking] = useState("");
  const [website, setWebsite] = useState("");
  const [noAnonymous, setNoAnonymous] = useState(false);

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
        const res = await fetch(`/api/agency/escort/contatti?escortUserId=${escortUserId}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const j = await res.json();
          const c = j.contacts || {};
          setPhone(c.phone || "");
          setApps(Array.isArray(c.apps) ? c.apps : []);
          setNote(c.note || "");
          setEmailBooking(c.emailBooking || "");
          setWebsite(c.website || "");
          setNoAnonymous(!!c.noAnonymous);
        }
      } finally { setLoading(false); }
    })();
  }, [escortUserId]);

  async function save() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
      const res = await fetch('/api/agency/escort/contatti', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ escortUserId, phone, apps, note, emailBooking, website, noAnonymous })
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || 'Errore salvataggio'); }
      else { alert('Contatti salvati'); }
    } finally { setSaving(false); }
  }

  function toggleApp(a: string) {
    setApps(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Contatti (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 text-gray-300">Telefono</label>
                <input value={phone} onChange={(e)=> setPhone(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-300">Email prenotazioni</label>
                <input type="email" value={emailBooking} onChange={(e)=> setEmailBooking(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-300">Sito Web</label>
              <input value={website} onChange={(e)=> setWebsite(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-300">App di contatto</label>
              <div className="flex flex-wrap gap-2">
                {['WhatsApp','Telegram','Signal'].map(a => (
                  <button key={a} type="button" onClick={()=> toggleApp(a)} className={`text-xs px-3 py-1 rounded border ${apps.includes(a) ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>{a}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="noanon" type="checkbox" checked={noAnonymous} onChange={(e)=> setNoAnonymous(e.target.checked)} />
              <label htmlFor="noanon" className="text-sm text-gray-300">Non accetto chiamate anonime</label>
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-300">Note</label>
              <textarea value={note} onChange={(e)=> setNote(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full min-h-[120px] placeholder-gray-400" />
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
