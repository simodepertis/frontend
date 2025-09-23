"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminCreditiImpostazioniPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    placementPricePerDayCredits: 10,
    placementMinDays: 1,
    placementMaxDays: 60,
  });
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const r = await fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${token}` } });
      const j = await r.json();
      if (!r.ok) { setNotice(j?.error || 'Errore caricamento impostazioni'); return; }
      const s = j.settings || {};
      setForm({
        placementPricePerDayCredits: Number(s.placementPricePerDayCredits || 10),
        placementMinDays: Number(s.placementMinDays || 1),
        placementMaxDays: Number(s.placementMaxDays || 60),
      });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const r = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const j = await r.json();
      if (!r.ok) { setNotice(j?.error || 'Errore salvataggio'); return; }
      setNotice('Impostazioni aggiornate');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Impostazioni Crediti" subtitle="Configura prezzo e giorni dei posizionamenti personalizzati" />
      {notice && (
        <div className="rounded-md p-3 text-sm bg-green-50 text-green-800 border border-green-200">{notice}</div>
      )}
      <div className="rounded-xl border bg-gray-800 p-5 grid md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Prezzo per giorno (crediti)</label>
          <input type="number" min={1} value={form.placementPricePerDayCredits}
            onChange={(e)=>setForm(f=>({...f, placementPricePerDayCredits: Number(e.target.value)}))}
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Giorni minimi</label>
          <input type="number" min={1} value={form.placementMinDays}
            onChange={(e)=>setForm(f=>({...f, placementMinDays: Number(e.target.value)}))}
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Giorni massimi</label>
          <input type="number" min={form.placementMinDays} value={form.placementMaxDays}
            onChange={(e)=>setForm(f=>({...f, placementMaxDays: Number(e.target.value)}))}
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <Button onClick={save} disabled={loading}>{loading ? 'Salvo…' : 'Salva impostazioni'}</Button>
        </div>
      </div>
    </div>
  );
}
