"use client";

import SectionHeader from "@/components/SectionHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ITALIAN_CITIES from "@/lib/cities";

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

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-3 text-white">Aggiungi città preferite</h3>
        <form onSubmit={add} className="flex flex-wrap items-center gap-2 max-w-xl">
          <select onChange={(e)=> setInput(e.target.value)} value={input} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
            <option value="">Seleziona città</option>
            {ITALIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="…o digita manualmente" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 flex-1 min-w-[200px]" />
          <Button type="submit">Aggiungi</Button>
        </form>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-3 text-white">Le tue città</h3>
        {cities.length === 0 ? (
          <div className="text-sm text-gray-400">Nessuna città aggiunta.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <span key={c} className="inline-flex items-center gap-2 border border-gray-600 bg-gray-900 text-gray-200 rounded-full px-3 py-1 text-sm">
                {c}
                <button onClick={() => remove(c)} className="text-gray-400 hover:text-red-400">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-3 text-white">Frequenza notifiche</h3>
        <div className="flex items-center gap-3">
          <select value={freq} onChange={(e) => setFreq(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
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
