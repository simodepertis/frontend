"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminCreditiSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [creditValueCents, setCreditValueCents] = useState<number>(100);
  const [currency, setCurrency] = useState<string>("EUR");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/API/admin/settings');
      if (res.ok) {
        const { settings } = await res.json();
        setCreditValueCents(settings?.creditValueCents ?? 100);
        setCurrency(settings?.currency ?? 'EUR');
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/API/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creditValueCents, currency }) });
      if (!res.ok) { const t = await res.text(); alert('Errore salvataggio: ' + t); }
      else alert('Impostazioni salvate');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Crediti" subtitle="Valore singolo credito e valuta" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 max-w-xl space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Valore credito (cent)</label>
          <input type="number" value={creditValueCents} onChange={(e) => setCreditValueCents(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <div className="text-xs text-gray-400">Esempio: 100 = 1,00 {currency}</div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Valuta</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva impostazioni'}</Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5">
        <div className="text-sm text-gray-400">Gestisci anche il catalogo prodotti a questa pagina:</div>
        <a href="/dashboard/admin/crediti/catalogo" className="text-blue-400 underline text-sm">Apri Catalogo Prodotti</a>
      </div>
    </div>
  );
}
