"use client";

import Link from "next/link";

export default function InstantBookPage() {
  const steps = [
    { t: "Configura orari", d: "Imposta giorni e fasce disponibili dal pannello Prenotazioni Istantanee." },
    { t: "Definisci prezzi", d: "Aggiungi le tariffe per durata (30 min, 1 ora, 2 ore, notte)." },
    { t: "Ricevi richieste", d: "Gli utenti ti inviano richieste nelle fasce disponibili." },
    { t: "Accetta o rifiuta", d: "Gestisci le richieste e conferma in un click." },
  ];
  const faq = [
    { q: "Posso mettere in pausa le richieste?", a: "Sì. Disattiva il toggle Prenotazioni nella dashboard per sospendere temporaneamente." },
    { q: "Come evito richieste fuori orario?", a: "Definisci solo le fasce orarie in cui vuoi essere contattata." },
    { q: "Serve un pagamento online?", a: "No. Al momento le richieste non richiedono caparra su piattaforma." },
  ];
  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Instant Book</h1>
        <p className="text-gray-300 mt-2">Attiva le prenotazioni rapide e ricevi richieste solo quando sei disponibile.</p>
      </div>

      {/* Come funziona */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-3">Come funziona</div>
        <div className="grid md:grid-cols-2 gap-3">
          {steps.map((s,i)=> (
            <div key={i} className="border border-gray-600 rounded-md p-3 bg-gray-900">
              <div className="text-sm text-white">{i+1}. {s.t}</div>
              <div className="text-xs text-gray-400">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <Link href="/dashboard/prenotazioni" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Vai a Prenotazioni Istantanee »</Link>
        </div>
      </div>

      {/* Vantaggi */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-2">Vantaggi principali</div>
        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
          <li>Richieste solo nelle fasce orarie definite</li>
          <li>Niente chat infinite: confermi con un click</li>
          <li>Più visibilità sugli utenti in tempo reale</li>
        </ul>
      </div>

      {/* FAQ */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="text-white font-semibold mb-3">FAQ</div>
        <div className="space-y-3">
          {faq.map((f,i)=> (
            <div key={i} className="border border-gray-600 rounded-md p-3 bg-gray-900">
              <div className="text-sm text-white">{f.q}</div>
              <div className="text-xs text-gray-400">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
