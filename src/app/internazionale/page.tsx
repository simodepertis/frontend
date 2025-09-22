"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export default function InternazionalePage() {
  const countries = ["Italia","Svizzera","Germania","Francia","Spagna","Austria","UK","Olanda","Belgio"];
  const languages = ["Italiano","Inglese","Spagnolo","Francese","Tedesco","Portoghese","Russo"];
  const [country, setCountry] = useState("");
  const [lang, setLang] = useState("");

  const mock = [
    { id: 1, name: "Anna (IT)", country: "Italia", langs: ["Italiano","Inglese"] },
    { id: 2, name: "Klara (DE)", country: "Germania", langs: ["Tedesco","Inglese"] },
    { id: 3, name: "Marie (FR)", country: "Francia", langs: ["Francese","Inglese"] },
  ];
  const filtered = useMemo(() => mock.filter(p =>
    (!country || p.country === country) && (!lang || p.langs.includes(lang))
  ), [country, lang]);

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Internazionale</h1>
        <p className="text-gray-300 mt-2">Selezione di profili e contenuti per Paese e lingua.</p>
      </div>

      {/* Filtri */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 grid md:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-sm text-gray-300">Paese</label>
          <select className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" value={country} onChange={e=>setCountry(e.target.value)}>
            <option value="">Tutti</option>
            {countries.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-300">Lingua</label>
          <select className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" value={lang} onChange={e=>setLang(e.target.value)}>
            <option value="">Tutte</option>
            {languages.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Link href="/ricerca-citta" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Ricerca per città »</Link>
        </div>
      </div>

      {/* Lista (mock) */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-400">Nessun risultato con i filtri selezionati.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <div className="text-white font-semibold">{p.name}</div>
              <div className="text-sm text-gray-300">{p.country}</div>
              <div className="text-xs text-blue-300 mt-1">{p.langs.join(" · ")}</div>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mt-6">
        <div className="text-white font-semibold mb-2">Note</div>
        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
          <li>La disponibilità internazionale dipende dal calendario tour delle escort.</li>
          <li>Le lingue indicate sono auto-dichiarate dai profili.</li>
        </ul>
      </div>
    </main>
  );
}
