"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminCatalogoCreditiPage() {
  type Product = { id: number; code: string; label: string; creditsCost: number; durationDays: number; active: boolean; updatedAt: string; pricePerDayCredits?: number|null; minDays?: number|null; maxDays?: number|null };
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Product[]>([]);
  const [form, setForm] = useState({ code: "", label: "", creditsCost: 0, durationDays: 0, pricePerDayCredits: "", minDays: "", maxDays: "" });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [rate, setRate] = useState<number>(10); // crediti per 1€
  const [euroForm, setEuroForm] = useState<string>("");
  const [euroMap, setEuroMap] = useState<Record<number, string>>({});

  useEffect(() => {
    try {
      const r = Number(localStorage.getItem('credits-per-euro') || '10');
      if (Number.isFinite(r) && r > 0) setRate(r);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('credits-per-euro', String(rate)); } catch {}
  }, [rate]);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch("/api/admin/credits/catalog", { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
      if (res.ok) {
        const { products } = await res.json();
        setList(products || []);
      } else {
        setList([]);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function createProduct() {
    if (!form.code.trim() || !form.label.trim() || form.creditsCost <= 0 || form.durationDays <= 0) {
      alert("Compila tutti i campi correttamente");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const payload:any = {
        code: form.code,
        label: form.label,
        creditsCost: form.creditsCost,
        durationDays: form.durationDays,
      };
      if (form.pricePerDayCredits) payload.pricePerDayCredits = Number(form.pricePerDayCredits);
      if (form.minDays) payload.minDays = Number(form.minDays);
      if (form.maxDays) payload.maxDays = Number(form.maxDays);
      const res = await fetch("/api/admin/credits/catalog", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) { const t = await res.text(); alert("Errore creazione: " + t); return; }
      setForm({ code: "", label: "", creditsCost: 0, durationDays: 0, pricePerDayCredits: "", minDays: "", maxDays: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function updateProduct(id: number, patch: Partial<Product>) {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch("/api/admin/credits/catalog", { method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ id, ...patch }) });
      if (!res.ok) { const t = await res.text(); alert("Errore aggiornamento: " + t); return; }
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Catalogo Crediti" subtitle="Gestisci prodotti, prezzi in crediti e durata" />
      <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3">
        <div className="font-semibold mb-1">Come modificare i pacchetti</div>
        <div>Per cambiare il prezzo/giorno di un pacchetto ESISTENTE usa le card qui sotto (sezione "Imposta prezzo/giorno"). Il box sopra "Crea prodotto" serve solo per <strong>aggiungere</strong> un nuovo pacchetto.</div>
      </div>

      {/* Tasso di conversione crediti/€ */}
      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-3 max-w-2xl">
        <div className="font-semibold text-white">Tasso di conversione</div>
        <div className="text-sm text-gray-400">Imposta quanti crediti valgono 1 Euro. Verrà usato per convertire prezzi in € in crediti.</div>
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 max-w-md">
          <div className="text-white">1 € =</div>
          <input type="number" min={1} value={rate} onChange={(e)=>setRate(Math.max(1, Number(e.target.value||0)))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <div className="text-white">Crediti</div>
        </div>
      </div>

      {/* Nuovo prodotto */}
      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-3 max-w-2xl">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Codice</label>
            <input value={form.code} onChange={(e)=>setForm(p=>({...p, code: e.target.value}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="VIP_7D" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm text-gray-300">Label</label>
            <input value={form.label} onChange={(e)=>setForm(p=>({...p, label: e.target.value}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="VIP 7 Giorni" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Crediti</label>
            <input type="number" min={1} value={form.creditsCost} onChange={(e)=>setForm(p=>({...p, creditsCost: Number(e.target.value)}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Durata (giorni)</label>
            <input type="number" min={1} value={form.durationDays} onChange={(e)=>setForm(p=>({...p, durationDays: Number(e.target.value)}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          </div>
          <div className="md:col-span-4 grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-300">Prezzo/giorno (crediti) — opzionale</label>
              <input value={form.pricePerDayCredits} onChange={(e)=>setForm(p=>({...p, pricePerDayCredits: e.target.value}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="Es. 5" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-300">Giorni min — opzionale</label>
              <input value={form.minDays} onChange={(e)=>setForm(p=>({...p, minDays: e.target.value}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="Es. 1" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-300">Giorni max — opzionale</label>
              <input value={form.maxDays} onChange={(e)=>setForm(p=>({...p, maxDays: e.target.value}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="Es. 60" />
            </div>
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm text-gray-300">Prezzo in € (auto-converte in crediti)</label>
            <div className="grid grid-cols-[1fr,auto] gap-2">
              <input type="number" min={0} value={euroForm} onChange={(e)=>{
                const eur = Number(e.target.value||0);
                setEuroForm(e.target.value);
                if (eur > 0) setForm(p=>({...p, creditsCost: Math.round(eur * rate)}));
              }} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="Es. 15" />
              <div className="self-center text-xs text-gray-300 flex items-center gap-1">
                <span className="opacity-80">→</span>
                <span className="inline-flex items-center justify-center min-w-[42px] h-6 px-2 rounded-md bg-gray-900 border border-gray-600 text-white font-medium">
                  {Math.max(0, Math.round((Number(euroForm)||0)*rate))}
                </span>
                <span className="opacity-80">crediti</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Button onClick={createProduct} disabled={saving}>{saving ? 'Creazione…' : 'Crea prodotto'}</Button>
        </div>
      </div>

      {/* Elenco prodotti */}
      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun prodotto</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map(p => (
              <div key={p.id} className="rounded-lg border border-gray-600 bg-gray-900 p-4 space-y-2">
                <div className="font-semibold text-white">{p.label}</div>
                <div className="text-xs text-gray-400">Codice: {p.code}</div>
                <div className="text-sm text-gray-300">Costo: {p.creditsCost} crediti</div>
                <div className="text-sm text-gray-300">Durata: {p.durationDays} giorni</div>
                {p.pricePerDayCredits != null && (
                  <div className="text-xs text-blue-300">Prezzo/giorno: {p.pricePerDayCredits} crediti · Range giorni: {p.minDays ?? 1}–{p.maxDays ?? 60}</div>
                )}
                <div className="text-xs text-gray-500">Aggiornato: {new Date(p.updatedAt).toLocaleString()}</div>
                <div className="pt-1">
                  <label className="block text-xs text-gray-400 mb-1">Imposta prezzo in €</label>
                  <div className="grid grid-cols-[1fr,auto] gap-2">
                    <input
                      type="number"
                      min={0}
                      value={euroMap[p.id] ?? ''}
                      onChange={(e)=>setEuroMap(m=>({ ...m, [p.id]: e.target.value }))}
                      className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                      placeholder="Es. 15"
                    />
                    <Button
                      variant="secondary"
                      disabled={updatingId === p.id}
                      onClick={() => {
                        const eur = Number(euroMap[p.id] || 0);
                        if (!Number.isFinite(eur) || eur <= 0) { alert('Inserisci un prezzo in € valido'); return; }
                        const credits = Math.round(eur * rate);
                        updateProduct(p.id, { creditsCost: credits });
                      }}
                    >Aggiorna prezzo</Button>
                  </div>
                  <div className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                    <span className="opacity-80">1 € =</span>
                    <span className="inline-flex items-center justify-center min-w-[38px] h-5 px-1.5 rounded-md bg-gray-900 border border-gray-600 text-white font-medium">{rate}</span>
                    <span className="opacity-80">crediti</span>
                    <span className="mx-1 opacity-50">·</span>
                    <span className="opacity-80">→</span>
                    <span className="inline-flex items-center justify-center min-w-[42px] h-5 px-1.5 rounded-md bg-gray-900 border border-gray-600 text-white font-medium">{Math.max(0, Math.round((Number(euroMap[p.id]||0))*rate))}</span>
                    <span className="opacity-80">crediti</span>
                  </div>
                </div>
                {/* Aggiornamento variabile semplificato: prezzo/giorno (min=1, max=60 automatici) */}
                <div className="grid md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Prezzo/giorno (crediti)" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-full" onChange={(e)=>setEuroMap(m=>({ ...m, [`pd_${p.id}`]: e.target.value }))} value={(euroMap as any)[`pd_${p.id}`] ?? ''} />
                    <Button variant="secondary" disabled={updatingId === p.id} onClick={()=>{
                      const v = Number((euroMap as any)[`pd_${p.id}`] || 0);
                      if (!Number.isFinite(v) || v <= 0) { alert('Prezzo/giorno non valido'); return; }
                      // Imposta anche min/max default per semplicità
                      updateProduct(p.id, { pricePerDayCredits: v, minDays: (p.minDays ?? 1), maxDays: (p.maxDays ?? 60) });
                    }}>Salva prezzo/giorno</Button>
                  </div>
                  <div className="text-xs text-gray-400 self-center">Se non impostati, min=1 e max=60 giorni verranno applicati automaticamente.</div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="secondary" disabled={updatingId === p.id} onClick={() => updateProduct(p.id, { active: !p.active })}>{p.active ? 'Disattiva' : 'Attiva'}</Button>
                  <Button variant="secondary" disabled={updatingId === p.id} onClick={() => updateProduct(p.id, { creditsCost: p.creditsCost + 10 })}>+10 crediti</Button>
                  <Button variant="secondary" disabled={updatingId === p.id} onClick={() => updateProduct(p.id, { durationDays: p.durationDays + 7 })}>+7 giorni</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
