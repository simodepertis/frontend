"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminOrdiniCreditiPage() {
  type Order = { id: number; userId: number; credits: number; method: string; status: string; createdAt: string; receiptUrl?: string; phone?: string };
  const [status, setStatus] = useState<'PENDING'|'PAID'|'FAILED'|'CANCELED'>('PENDING');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/API/admin/credits/orders?status=${status}`);
      if (res.ok) {
        const { orders } = await res.json();
        setOrders(orders || []);
      } else {
        setOrders([]);
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [status]);

  async function act(id: number, action: 'approve'|'reject') {
    setActingId(id);
    try {
      const res = await fetch('/API/admin/credits/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || 'Errore operazione'); return; }
      await load();
    } finally { setActingId(null); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Ordini Crediti" subtitle="Approva o rifiuta ordini manuali (bollettino/bonifico)" />

      <div className="flex items-center gap-2">
        <select className="border rounded-md px-3 py-2" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
          <option value="PENDING">In attesa</option>
          <option value="PAID">Pagati</option>
          <option value="FAILED">Rifiutati</option>
          <option value="CANCELED">Annullati</option>
        </select>
        <Button variant="secondary" onClick={load}>Ricarica</Button>
      </div>

      <div className="rounded-xl border bg-white p-5">
        {loading ? (
          <div className="text-sm text-neutral-500">Caricamento…</div>
        ) : orders.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessun ordine</div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="border rounded-md p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">Ordine #{o.id} · Utente {o.userId}</div>
                    <div className="text-xs text-neutral-600">Crediti: {o.credits} · Metodo: {o.method} · Stato: {o.status}</div>
                    {o.phone && <div className="text-xs text-neutral-600">Telefono causale: {o.phone}</div>}
                    {o.receiptUrl && <a href={o.receiptUrl} target="_blank" className="text-xs text-blue-600 underline">Vedi ricevuta</a>}
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'PENDING' && (
                      <>
                        <Button onClick={()=>act(o.id,'approve')} disabled={actingId===o.id}>Approva</Button>
                        <Button variant="secondary" onClick={()=>act(o.id,'reject')} disabled={actingId===o.id}>Rifiuta</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
