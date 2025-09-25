"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";

interface EscortItem { id: number; nome: string; }

export default function HappyHourPage() {
  const [escorts, setEscorts] = useState<EscortItem[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [range, setRange] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/agency/escorts');
        if (res.ok) {
          const data = await res.json();
          const items = (data.items || []).map((x: any) => ({ id: x.user?.id, nome: x.user?.nome })).filter((x: any) => x.id);
          setEscorts(items);
        }
      } catch {}
    })();
  }, []);

  async function save() {
    // Placeholder: salva nel futuro endpoint /api/agency/happy-hour
    alert('Happy Hour salvato (placeholder)');
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Happy Hour" subtitle="Seleziona le escort e specifica gli Happy Hour" />

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-300 space-y-3">
        <div>
          <label className="block text-xs mb-1">Scegli Escort</label>
          <select value={selected} onChange={(e)=> setSelected(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
            <option value="">Tutte Le Modelle</option>
            {escorts.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Intervallo</label>
          <input value={range} onChange={(e)=> setRange(e.target.value)} placeholder="Es. 18:00–19:00" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
        </div>
        <div>
          <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">Salva</button>
        </div>
        {escorts.length === 0 && (
          <div className="text-sm text-gray-400">Nessuna escort trovata.</div>
        )}
      </div>
    </div>
  );
}
