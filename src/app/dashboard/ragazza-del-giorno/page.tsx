"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function RagazzaDelGiornoPage() {
  type Entry = { id: string; date: string; photo: string; note?: string; status: "in_review" | "approved" | "rejected" };
  const [entries, setEntries] = useState<Entry[]>([]);
  const [date, setDate] = useState("");
  const [photo, setPhoto] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem("escort-gotd"); if (raw) setEntries(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("escort-gotd", JSON.stringify(entries)); } catch {}
  }, [entries]);

  function apply() {
    if (!date || !photo) return;
    setEntries((e) => [...e, { id: `${date}-${Date.now()}`, date, photo, note, status: "in_review" }]);
    setDate(""); setPhoto(""); setNote("");
    alert("Candidatura inviata per revisione.");
  }
  function withdraw(id: string) { setEntries((e) => e.filter(x => x.id !== id)); }

  return (
    <div className="space-y-6">
      <SectionHeader title="Ragazza del Giorno" subtitle="Partecipa e metti in evidenza il tuo profilo" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-2 text-white">Regole</div>
        <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
          <li>Una candidatura per giorno per profilo.</li>
          <li>La foto deve rispettare le linee guida del sito.</li>
          <li>La selezione è a discrezione della redazione.</li>
        </ul>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-3">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="URL Foto" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opzionale)" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <Button onClick={apply} disabled={!date || !photo}>Invia candidatura</Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-3 text-white">Le tue candidature ({entries.length})</div>
        {entries.length === 0 ? (
          <div className="text-sm text-gray-400">Nessuna candidatura inviata.</div>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="border border-gray-600 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-gray-300">
                  <div className="font-medium text-white">{e.date}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[360px]">{e.photo}</div>
                  {e.note && <div className="text-xs text-gray-400">Note: {e.note}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${e.status === 'approved' ? 'bg-green-900/40 text-green-300 border-green-700' : e.status === 'rejected' ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-yellow-900/30 text-yellow-300 border-yellow-700'}`}>
                    {e.status === 'approved' ? 'Approvata' : e.status === 'rejected' ? 'Rifiutata' : 'In revisione'}
                  </span>
                  <Button variant="secondary" onClick={() => withdraw(e.id)}>Ritira</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
