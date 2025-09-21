"use client";

import SectionHeader from "@/components/SectionHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AvvisiPage() {
  const [alerts, setAlerts] = useState([
    { id: 1, label: "Nuovi profili a Milano", type: "nuovi-profili", freq: "giornaliero", active: true },
    { id: 2, label: "Escort verificate vicino a te", type: "verificate", freq: "settimanale", active: false },
  ]);
  const [type, setType] = useState("nuovi-profili");
  const [freq, setFreq] = useState("giornaliero");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const label = type === "nuovi-profili" ? "Nuovi profili" : type === "tour" ? "In tour" : "Verificate";
    setAlerts((a) => [{ id: Date.now(), label, type, freq, active: true }, ...a]);
  };
  const toggle = (id: number) => setAlerts((a) => a.map(x => x.id === id ? { ...x, active: !x.active } : x));
  const remove = (id: number) => setAlerts((a) => a.filter(x => x.id !== id));

  return (
    <div className="space-y-6">
      <SectionHeader title="Avvisi" subtitle="Crea e gestisci i tuoi avvisi" />

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-semibold mb-3">Crea un nuovo avviso</h3>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
          <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded-md px-3 py-2">
            <option value="nuovi-profili">Nuovi profili</option>
            <option value="verificate">Escort verificate</option>
            <option value="tour">In tour vicino a te</option>
          </select>
          <select value={freq} onChange={(e) => setFreq(e.target.value)} className="border rounded-md px-3 py-2">
            <option value="giornaliero">Giornaliero</option>
            <option value="settimanale">Settimanale</option>
            <option value="mensile">Mensile</option>
          </select>
          <Button type="submit">Crea avviso</Button>
        </form>
      </div>

      <div className="rounded-lg border bg-white divide-y">
        {alerts.map((a) => (
          <div key={a.id} className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-semibold text-sm">{a.label}</div>
              <div className="text-xs text-neutral-500">Frequenza: {a.freq}</div>
            </div>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={a.active} onChange={() => toggle(a.id)} /> Attivo
            </label>
            <Button variant="secondary" onClick={() => remove(a.id)}>Rimuovi</Button>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="p-6 text-center text-sm text-neutral-500">Nessun avviso creato.</div>
        )}
      </div>
    </div>
  );
}
