"use client";

import SectionHeader from "@/components/SectionHeader";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { escorts } from "@/lib/mock";

export default function RecensioniPage() {
  const [tab, setTab] = useState<"ricevute" | "scritte">("ricevute");
  const [minStars, setMinStars] = useState(0);

  const mockReviews = useMemo(() => {
    return escorts.slice(0, 10).map((e, i) => ({
      id: i + 1,
      author: tab === "ricevute" ? `${e.nome}` : "Tu",
      target: tab === "ricevute" ? "Tu" : `${e.nome}`,
      stars: (i % 5) + 1,
      text: "Servizio professionale, puntuale e molto cordiale.",
      date: `${10 + i} set, 2025`,
      url: `/escort/${e.slug}`,
    })).filter(r => r.stars >= minStars);
  }, [tab, minStars]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Recensioni" subtitle="Gestisci e consulta le tue recensioni" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3 py-1.5 rounded-md border cursor-pointer ${tab === 'ricevute' ? 'bg-gray-700 text-white border-blue-600' : 'border-gray-600 text-gray-300'}`} onClick={() => setTab("ricevute")}>Ricevute</div>
          <div className={`px-3 py-1.5 rounded-md border cursor-pointer ${tab === 'scritte' ? 'bg-gray-700 text-white border-blue-600' : 'border-gray-600 text-gray-300'}`} onClick={() => setTab("scritte")}>Scritte</div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>Min stelle</span>
            <select value={minStars} onChange={(e) => setMinStars(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-2 py-1">
              <option value={0}>Tutte</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={5}>5</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 divide-y divide-gray-700">
        {mockReviews.map((r) => (
          <div key={r.id} className="p-4 flex items-start gap-4">
            <div className="text-sm text-gray-400 w-24 shrink-0">{r.date}</div>
            <div className="flex-1">
              <div className="text-sm text-gray-300"><span className="font-semibold text-white">{r.author}</span> → <span className="font-semibold text-white">{r.target}</span></div>
              <div className="text-yellow-400 text-sm">{"★".repeat(r.stars)}<span className="text-gray-600">{"★".repeat(5 - r.stars)}</span></div>
              <div className="text-sm text-gray-300 mt-1">{r.text}</div>
            </div>
            <div className="flex flex-col items-end gap-2 w-40">
              <Link href={r.url} className="text-blue-400 hover:underline text-sm">Vedi profilo</Link>
              {tab === "ricevute" ? (
                <Button variant="secondary" size="sm">Rispondi</Button>
              ) : (
                <Button variant="secondary" size="sm">Modifica</Button>
              )}
            </div>
          </div>
        ))}
        {mockReviews.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-400">Nessuna recensione con questi filtri.</div>
        )}
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-2 text-white">Scrivi una recensione</h3>
        <p className="text-sm text-gray-400">In futuro collegheremo questo form al DB e alla moderazione; per ora è un placeholder.</p>
        <div className="mt-3">
          <Button>Apri form</Button>
        </div>
      </div>
    </div>
  );
}
