"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminCatalogoCreditiPage() {
  type Product = { id: number; code: string; label: string; creditsCost: number; durationDays: number; active: boolean; updatedAt: string };
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Product[]>([]);
  const [form, setForm] = useState({ code: "", label: "", creditsCost: 0, durationDays: 0 });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/credits/catalog");
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
      const res = await fetch("/api/admin/credits/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const t = await res.text(); alert("Errore creazione: " + t); return; }
      setForm({ code: "", label: "", creditsCost: 0, durationDays: 0 });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function updateProduct(id: number, patch: Partial<Product>) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/credits/catalog", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
      if (!res.ok) { const t = await res.text(); alert("Errore aggiornamento: " + t); return; }
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Catalogo Crediti" subtitle="Gestisci prodotti, prezzi in crediti e durata" />

      {/* Nuovo prodotto */}
      <div className="rounded-xl border bg-white p-5 space-y-3 max-w-2xl">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-600">Codice</label>
            <input value={form.code} onChange={(e)=>setForm(p=>({...p, code: e.target.value}))} className="border rounded-md px-3 py-2" placeholder="VIP_7D" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm text-neutral-600">Label</label>
            <input value={form.label} onChange={(e)=>setForm(p=>({...p, label: e.target.value}))} className="border rounded-md px-3 py-2" placeholder="VIP 7 Giorni" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-600">Crediti</label>
            <input type="number" min={1} value={form.creditsCost} onChange={(e)=>setForm(p=>({...p, creditsCost: Number(e.target.value)}))} className="border rounded-md px-3 py-2" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-600">Durata (giorni)</label>
            <input type="number" min={1} value={form.durationDays} onChange={(e)=>setForm(p=>({...p, durationDays: Number(e.target.value)}))} className="border rounded-md px-3 py-2" />
          </div>
        </div>
        <div>
          <Button onClick={createProduct} disabled={saving}>{saving ? 'Creazione…' : 'Crea prodotto'}</Button>
        </div>
      </div>

      {/* Elenco prodotti */}
      <div className="rounded-xl border bg-white p-5">
        {loading ? (
          <div className="text-sm text-neutral-500">Caricamento…</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessun prodotto</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map(p => (
              <div key={p.id} className="rounded-lg border p-4 space-y-2">
                <div className="font-semibold">{p.label}</div>
                <div className="text-xs text-neutral-600">Codice: {p.code}</div>
                <div className="text-sm">Costo: {p.creditsCost} crediti</div>
                <div className="text-sm">Durata: {p.durationDays} giorni</div>
                <div className="text-xs text-neutral-500">Aggiornato: {new Date(p.updatedAt).toLocaleString()}</div>
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
