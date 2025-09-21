"use client";

import SectionHeader from "@/components/SectionHeader";
import { useMemo, useState } from "react";
import { escorts } from "@/lib/mock";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PreferitiPage() {
  const initialFavs = useMemo(() => escorts.slice(0, 8).map(e => ({ id: e.id, slug: e.slug, nome: e.nome, city: e.city, photo: e.photo })), []);
  const [tab, setTab] = useState<"preferiti" | "top10">("preferiti");
  const [favs, setFavs] = useState(initialFavs);

  const remove = (id: number) => setFavs((xs) => xs.filter(x => x.id !== id));
  const move = (index: number, dir: -1 | 1) => setFavs((xs) => {
    const arr = [...xs];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return arr;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    return arr;
  });

  const top10 = useMemo(() => escorts.slice(0, 10).map((e, i) => ({ rank: i + 1, ...e })), []);

  return (
    <div className="space-y-6">
      <SectionHeader title="Preferiti / Top 10" subtitle="Gestisci i tuoi preferiti e la classifica personale" />

      <div className="rounded-lg border bg-white p-3 flex items-center gap-3">
        <button className={`px-3 py-1.5 rounded-md border ${tab === 'preferiti' ? 'bg-neutral-100 font-semibold' : ''}`} onClick={() => setTab('preferiti')}>Preferiti</button>
        <button className={`px-3 py-1.5 rounded-md border ${tab === 'top10' ? 'bg-neutral-100 font-semibold' : ''}`} onClick={() => setTab('top10')}>Top 10</button>
      </div>

      {tab === "preferiti" ? (
        <div className="space-y-3">
          <div className="text-sm text-neutral-600">{favs.length} preferiti</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favs.map((e, i) => (
              <div key={e.id} className="group border rounded-lg overflow-hidden bg-white shadow-sm">
                <Link href={`/escort/${e.slug}`} className="block">
                  <div className="relative w-full aspect-[3/4]">
                    <Image src={e.photo} alt={e.nome} fill className="object-cover group-hover:scale-105 transition-transform" />
                  </div>
                </Link>
                <div className="p-2">
                  <div className="text-sm font-semibold truncate">{e.nome}</div>
                  <div className="text-xs text-neutral-500 truncate">{e.city}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => move(i, -1)}>Su</Button>
                    <Button variant="secondary" size="sm" onClick={() => move(i, 1)}>Giù</Button>
                    <Button variant="secondary" size="sm" onClick={() => remove(e.id)}>Rimuovi</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {top10.map((e) => (
            <Link key={e.id} href={`/escort/${e.slug}`} className="border rounded-lg overflow-hidden bg-white shadow-sm relative group">
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">#{e.rank}</span>
              <div className="relative w-full aspect-[3/4]">
                <Image src={e.photo} alt={e.nome} fill className="object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-2">
                <div className="text-sm font-semibold truncate">{e.nome}</div>
                <div className="text-xs text-neutral-500 truncate">{e.city}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
