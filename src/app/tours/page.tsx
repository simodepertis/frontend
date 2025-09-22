"use client";

import { useMemo, useState } from "react";
import ITALIAN_CITIES from "@/lib/cities";
import Link from "next/link";

type TourItem = { id: string; name: string; cities: string[]; period: string; cover?: string };

export default function ToursPage() {
  const [city, setCity] = useState("");
  const [month, setMonth] = useState("");

  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  // Mock (in futuro: /api/public/annunci?onTour=true)
  const all: TourItem[] = [
    { id: "t1", name: "Anna", cities: ["Milano", "Torino"], period: "5-12 Mag", cover: "/placeholder.svg" },
    { id: "t2", name: "Sofia", cities: ["Roma", "Napoli"], period: "20-27 Giu", cover: "/placeholder.svg" },
    { id: "t3", name: "Giulia", cities: ["Bologna", "Verona"], period: "10-18 Lug", cover: "/placeholder.svg" },
  ];

  const filtered = useMemo(() => all.filter(t =>
    (!city || t.cities.includes(city)) && (!month || t.period.toLowerCase().includes(month.toLowerCase()))
  ), [city, month]);

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Tour Città</h1>
        <p className="text-gray-300 mt-2">Scopri chi è in tour nelle principali città italiane.</p>
      </div>

      {/* Filtri */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 grid md:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-sm text-gray-300">Città</label>
          <select className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                  value={city} onChange={e=>setCity(e.target.value)}>
            <option value="">Tutte</option>
            {ITALIAN_CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-300">Mese</label>
          <select className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                  value={month} onChange={e=>setMonth(e.target.value)}>
            <option value="">Tutti i mesi</option>
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Link href="/ricerca-citta" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Cerca per città »</Link>
        </div>
      </div>

      {/* Lista tour */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-400">Nessun tour trovato con i filtri selezionati.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(t => (
            <div key={t.id} className="rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-700" style={{backgroundImage:`url(${t.cover})`, backgroundSize:'cover'}} />
              <div className="p-4">
                <div className="text-white font-semibold">{t.name}</div>
                <div className="text-sm text-gray-300">{t.cities.join(" · ")}</div>
                <div className="text-xs text-blue-300 mt-1">{t.period}</div>
                <div className="mt-3 text-right">
                  <Link href={`/annunci?citta=${encodeURIComponent(city || t.cities[0])}`} className="text-blue-400 hover:underline text-sm">Vedi annunci »</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
