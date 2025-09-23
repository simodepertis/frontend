"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import EscortCard from "@/components/EscortCard";

export default function InternazionalePage() {
  const flags = [
    { code: "fr", label: "Francia", href: "/annunci?country=FR", img: "/flags/fr.svg" },
    { code: "it", label: "Italia", href: "/annunci?country=IT", img: "/flags/it.svg" },
    { code: "de", label: "Germania", href: "/annunci?country=DE", img: "/flags/de.svg" },
    { code: "es", label: "Spagna", href: "/annunci?country=ES", img: "/flags/es.svg" },
    { code: "gb", label: "UK", href: "/annunci?country=UK", img: "/flags/gb.svg" },
    { code: "ch", label: "Svizzera", href: "/annunci?country=CH", img: "/flags/ch.svg" },
    { code: "nl", label: "Olanda", href: "/annunci?country=NL", img: "/flags/nl.svg" },
    { code: "be", label: "Belgio", href: "/annunci?country=BE", img: "/flags/be.svg" },
  ];

  const cities: { name: string; count: number; href: string; highlight?: boolean }[] = [
    { name: "Paris", count: 331, href: "/annunci?country=FR&citta=Parigi", highlight: true },
    { name: "London", count: 179, href: "/annunci?country=UK&citta=London" },
    { name: "Zurich", count: 25, href: "/annunci?country=CH&citta=Zurigo" },
    { name: "Amsterdam", count: 60, href: "/annunci?country=NL&citta=Amsterdam" },
    { name: "Berlin", count: 42, href: "/annunci?country=DE&citta=Berlin" },
    { name: "Madrid", count: 35, href: "/annunci?country=ES&citta=Madrid" },
    { name: "Barcelona", count: 34, href: "/annunci?country=ES&citta=Barcellona" },
    { name: "Lisbon", count: 36, href: "/annunci?country=PT&citta=Lisbon" },
    { name: "Warsaw", count: 65, href: "/annunci?country=PL&citta=Warsaw" },
    { name: "Moscow", count: 54, href: "/annunci?country=RU&citta=Moscow", highlight: true },
    { name: "Abu Dhabi", count: 159, href: "/annunci?country=AE&citta=Abu%20Dhabi" },
    { name: "Doha", count: 149, href: "/annunci?country=QA&citta=Doha" },
    { name: "Dubai", count: 331, href: "/annunci?country=AE&citta=Dubai", highlight: true },
    { name: "Hong Kong", count: 38, href: "/annunci?country=HK&citta=Hong%20Kong" },
    { name: "Bucharest", count: 44, href: "/annunci?country=RO&citta=Bucarest" },
    { name: "Montreal", count: 31, href: "/annunci?country=CA&citta=Montreal" },
  ];

  // Distribuisci in 4 colonne come nello screenshot
  const colCount = 4;
  const perCol = Math.ceil(cities.length / colCount);
  const columns = Array.from({ length: colCount }, (_, i) => cities.slice(i * perCol, (i + 1) * perCol));

  // Carica profili pubblici per griglia editoriale
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/public/annunci');
        if (res.ok) {
          const j = await res.json();
          setItems(j.items || []);
        } else { setItems([]); }
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* H1 */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white">Internazionale</h1>
        <p className="text-gray-300">Selezione internazionale per Paese e città. Francia aggiunta e SEO collegata.</p>
      </div>

      {/* STRISCIA BANDIERE IN ALTO (SEO + UX) */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {flags.map(f => (
          <Link key={f.code} href={f.href} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-600 bg-gray-800 hover:border-blue-600">
            {/* Se non abbiamo le SVG, fallback a emoji flag */}
            <span className="text-lg">{f.code === 'fr' ? '🇫🇷' : f.code === 'it' ? '🇮🇹' : f.code === 'de' ? '🇩🇪' : f.code === 'es' ? '🇪🇸' : f.code === 'gb' ? '🇬🇧' : f.code === 'ch' ? '🇨🇭' : f.code === 'nl' ? '🇳🇱' : f.code === 'be' ? '🇧🇪' : '🏳️'}</span>
            <span className="text-sm text-white">{f.label}</span>
          </Link>
        ))}
      </div>

      {/* LISTA CITTÀ IN COLONNE (SOPRA, NON SOTTO) */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {columns.map((col, idx) => (
            <div key={idx} className="space-y-2">
              {col.map(c => (
                <Link key={c.name} href={c.href} className={`flex items-center justify-between text-sm ${c.highlight ? 'text-amber-400 font-semibold' : 'text-gray-300 hover:text-white'}`}>
                  <span>{c.name}</span>
                  <span>{c.count}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 text-right">
          <Link href="/ricerca-citta" className="text-sm text-blue-400 hover:underline">ALTRE CITTÀ ↓</Link>
        </div>
      </div>

      {/* Griglia profili (stile editoriale) */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Escort in evidenza</h2>
          <Link href="/annunci" className="text-sm text-blue-400 hover:underline">Vedi tutti »</Link>
        </div>
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun profilo disponibile.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.slice(0, 12).map((e: any) => (
              <Link key={e.id} href={`/escort/${e.slug}`}>
                <EscortCard escort={{ id: e.id, nome: e.name, eta: 25, citta: Array.isArray(e.cities)&&e.cities[0]?String(e.cities[0]):'—', prezzo: 0, foto: e.coverUrl || '/placeholder.svg', rank: e.tier, isVerified: e.isVerified }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
