"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function CarrelloPage() {
  type Pack = { id: string; name: string; desc: string; price: number; badge?: string };
  const [items, setItems] = useState<Pack[]>([]);

  useEffect(() => {
    try { const raw = localStorage.getItem("escort-cart"); if (raw) setItems(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("escort-cart", JSON.stringify(items)); } catch {}
  }, [items]);

  const total = useMemo(() => items.reduce((s, i) => s + (i.price || 0), 0), [items]);

  const remove = (idx: number) => setItems((arr) => arr.filter((_, i) => i !== idx));
  const clear = () => setItems([]);
  const checkout = () => {
    if (items.length === 0) return alert("Il carrello è vuoto");
    alert("Checkout simulato. Integrazione pagamento verrà aggiunta in produzione.");
    setItems([]);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Carrello" subtitle="Riepilogo ordini e checkout" />
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        {items.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun articolo nel carrello.</div>
        ) : (
          <div className="space-y-3">
            {items.map((p, idx) => (
              <div key={`${p.id}-${idx}`} className="border border-gray-600 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.desc}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-white">€ {p.price}</div>
                  <Button variant="secondary" onClick={() => remove(idx)}>Rimuovi</Button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <div className="text-sm text-gray-300">Totale</div>
              <div className="text-lg font-semibold text-white">€ {total}</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={clear}>Svuota</Button>
              <Button onClick={checkout}>Procedi al pagamento</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
