"use client";

import { useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import ITALIAN_CITIES from "@/lib/cities";
import { Button } from "@/components/ui/button";

export default function NuovoAnnuncioPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<"PHYSICAL"|"VIRTUAL">("PHYSICAL");
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/me/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, body, city, type }) });
      const j = await res.json();
      if (!res.ok) { setErrMsg(j?.error || 'Errore'); setOkMsg(""); return; }
      setOkMsg('Annuncio creato e inviato in moderazione');
      setErrMsg("");
      setTitle(""); setBody(""); setCity(""); setType("PHYSICAL");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Nuovo Annuncio" subtitle="Crea un annuncio pubblico, verrà pubblicato dopo moderazione" />

      {okMsg && (
        <div className="rounded-md border border-green-700 bg-green-900/40 text-green-200 px-3 py-2 max-w-2xl">{okMsg}</div>
      )}
      {errMsg && (
        <div className="rounded-md border border-red-700 bg-red-900/40 text-red-200 px-3 py-2 max-w-2xl">{errMsg}</div>
      )}

      <form onSubmit={submit} className="rounded-lg border border-gray-600 bg-gray-800 p-4 grid gap-3 max-w-2xl">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Titolo</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Testo</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 h-40" required />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Città</label>
            <select value={city} onChange={e=>setCity(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" required>
              <option value="">Seleziona città</option>
              {ITALIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Tipo</label>
            <select value={type} onChange={e=>setType(e.target.value as any)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
              <option value="PHYSICAL">Fisico</option>
              <option value="VIRTUAL">Virtuale</option>
            </select>
          </div>
        </div>
        <div className="pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Invio…' : 'Pubblica annuncio'}</Button>
        </div>
      </form>
    </div>
  );
}
