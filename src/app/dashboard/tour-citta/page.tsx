"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ITALIAN_CITIES from "@/lib/cities";

export default function TourCittaPage() {
  type TourItem = { id: string; city: string; start: string; end: string; note?: string };
  const [items, setItems] = useState<TourItem[]>([]);
  const [draft, setDraft] = useState<TourItem>({ id: "", city: "", start: "", end: "", note: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("escort-tour");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("escort-tour", JSON.stringify(items)); } catch {}
  }, [items]);

  function add() {
    if (!draft.city || !draft.start || !draft.end) return;
    setItems((prev) => [...prev, { ...draft, id: `${draft.city}-${draft.start}-${Date.now()}` }]);
    setDraft({ id: "", city: "", start: "", end: "", note: "" });
  }
  function remove(id: string) {
    setItems((prev) => prev.filter(i => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Tour Città" subtitle="Pianifica e comunica le tue date in tour" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
            <option value="">Seleziona città</option>
            {ITALIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <input type="date" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Note (opzionale)" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
        </div>
        <div className="flex justify-end">
          <Button onClick={add} disabled={!draft.city || !draft.start || !draft.end}>Aggiungi</Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-3 text-white">Prossimi tour ({items.length})</div>
        {items.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun tour pianificato.</div>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.id} className="border border-gray-600 rounded-md p-3 bg-gray-900 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-medium text-sm text-white">{i.city} · {i.start} → {i.end}</div>
                  {i.note && <div className="text-xs text-gray-400">{i.note}</div>}
                </div>
                <div>
                  <Button variant="secondary" onClick={() => remove(i.id)}>Rimuovi</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
