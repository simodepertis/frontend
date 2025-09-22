"use client";

import Link from "next/link";

export default function HappyHourPage() {
  const steps = [
    { t: "Scegli il pacchetto", d: "Vai su Catalogo Crediti e scegli un posizionamento a giorni o VIP." },
    { t: "Attiva l'Happy Hour", d: "Seleziona una fascia oraria in cui vuoi il boost di visibilità." },
    { t: "Ottieni il boost", d: "Durante l'Happy Hour il tuo profilo sale nelle liste e ottiene badge speciale." },
  ];
  const examples = [
    { t: "Milano 18–20", d: "2 ore di priorità serale — ideale per after work." },
    { t: "Weekend Roma", d: "Sab-Dom dalle 16 alle 19 — alta affluenza utenti." },
    { t: "Notte Napoli", d: "Venerdì 22–24 — per spingere last minute." },
  ];
  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Happy Hour</h1>
        <p className="text-gray-300 mt-2">Promozioni a tempo per aumentare la visibilità del tuo profilo nelle fasce strategiche.</p>
      </div>

      {/* Come funziona */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-3">Come funziona</div>
        <div className="grid md:grid-cols-3 gap-3">
          {steps.map((s,i)=> (
            <div key={i} className="border border-gray-600 rounded-md p-3 bg-gray-900">
              <div className="text-sm text-white">{i+1}. {s.t}</div>
              <div className="text-xs text-gray-400">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <Link href="/dashboard/pubblicita" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Acquista Pubblicità »</Link>
        </div>
      </div>

      {/* Esempi */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-2">Esempi d'uso</div>
        <div className="grid md:grid-cols-3 gap-3">
          {examples.map((x,i)=>(
            <div key={i} className="border border-gray-600 rounded-md p-3 bg-gray-900">
              <div className="text-sm text-white">{x.t}</div>
              <div className="text-xs text-gray-400">{x.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="text-white font-semibold mb-2">Note</div>
        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
          <li>Le promo a tempo non consumano più crediti del pacchetto: riallocano la visibilità nelle fasce scelte.</li>
          <li>Puoi combinarle con i posizionamenti a giorni (pausa/riprendi disponibili).</li>
          <li>Badge e priorità cessano automaticamente al termine dell'Happy Hour.</li>
        </ul>
      </div>
    </main>
  );
}
