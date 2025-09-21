"use client";

import SectionHeader from "@/components/SectionHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AvvisiCittaPage() {
  const [cities, setCities] = useState<string[]>(["Milano", "Roma"]);
  const [input, setInput] = useState("");
  const [freq, setFreq] = useState("settimanale");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const c = input.trim();
    if (!c) return;
    if (!cities.includes(c)) setCities([c, ...cities]);
    setInput("");
  };
  const remove = (c: string) => setCities((xs) => xs.filter(x => x !== c));

  return (
    <div className="space-y-6">
      <SectionHeader title="Avvisi Città" subtitle="Ricevi notifiche per nuove escort nella tua città" />

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-semibold mb-3">Aggiungi città preferite</h3>
        <form onSubmit={add} className="flex flex-wrap items-center gap-2 max-w-xl">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Es. Torino" className="border rounded-md px-3 py-2 flex-1 min-w-[200px]" />
          <Button type="submit">Aggiungi</Button>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-semibold mb-3">Le tue città</h3>
        {cities.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessuna città aggiunta.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <span key={c} className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-sm">
                {c}
                <button onClick={() => remove(c)} className="text-neutral-500 hover:text-red-600">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-semibold mb-3">Frequenza notifiche</h3>
        <div className="flex items-center gap-3">
          <select value={freq} onChange={(e) => setFreq(e.target.value)} className="border rounded-md px-3 py-2">
            <option value="giornaliero">Giornaliero</option>
            <option value="settimanale">Settimanale</option>
            <option value="mensile">Mensile</option>
          </select>
          <Button onClick={() => alert("Preferenze salvate")}>Salva</Button>
        </div>
      </div>
    </div>
  );
}
