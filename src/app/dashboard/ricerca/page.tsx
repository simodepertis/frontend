"use client";

import SectionHeader from "@/components/SectionHeader";
import { useMemo, useState } from "react";
import { escorts } from "@/lib/mock";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RicercaPage() {
  const [city, setCity] = useState("");
  const [hair, setHair] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [verified, setVerified] = useState(false);
  const [inTour, setInTour] = useState(false);

  const results = useMemo(() => {
    return escorts.filter((e) => {
      if (city && e.city !== city) return false;
      if (hair && e.capelli !== hair) return false;
      const p = e.prezzo ?? 0;
      if (min && p < Number(min)) return false;
      if (max && p > Number(max)) return false;
      if (verified && !e.verified) return false;
      if (inTour && !e.inTour) return false;
      return true;
    });
  }, [city, hair, min, max, verified, inTour]);

  const reset = () => {
    setCity(""); setHair(""); setMin(""); setMax(""); setVerified(false); setInTour(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="La Ricerca" subtitle="Cerca in base a città e preferenze" />

      <div className="rounded-lg border bg-white p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="border rounded-md px-3 py-2">
            <option value="">Tutte le città</option>
            <option>Milano</option>
            <option>Roma</option>
            <option>Firenze</option>
            <option>Napoli</option>
            <option>Bologna</option>
          </select>
          <select value={hair} onChange={(e) => setHair(e.target.value)} className="border rounded-md px-3 py-2">
            <option value="">Tutti i capelli</option>
            <option>Biondi</option>
            <option>Castani</option>
            <option>Neri</option>
          </select>
          <input value={min} onChange={(e) => setMin(e.target.value)} placeholder="€ min" className="border rounded-md px-3 py-2" />
          <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="€ max" className="border rounded-md px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Verified
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={inTour} onChange={(e) => setInTour(e.target.checked)} /> In tour
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={reset} variant="secondary">Reset</Button>
          <span className="text-sm text-neutral-600 self-center">{results.length} risultati</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((e) => (
          <Link key={e.id} href={`/escort/${e.slug}`} className="block group">
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl border shadow-sm bg-white">
              <Image src={e.photo} alt={e.nome} fill className="object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="mt-2 px-0.5">
              <div className="text-sm font-semibold text-neutral-800 truncate group-hover:underline">{e.nome}</div>
              <div className="text-xs text-neutral-500 truncate">{e.city} • {e.capelli} • €{e.prezzo}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
