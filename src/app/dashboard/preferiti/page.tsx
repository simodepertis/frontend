"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { escorts } from "@/lib/mock";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PreferitiPage() {
  const [tab, setTab] = useState<"preferiti" | "top10">("preferiti");
  const [favs, setFavs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          setFavs([]);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/user/favorites', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setFavs(data.favorites || []);
        } else {
          setFavs([]);
        }
      } catch (error) {
        console.error('Errore caricamento preferiti:', error);
        setFavs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const remove = async (targetUserId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const res = await fetch('/api/user/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });

      if (res.ok) {
        setFavs((xs) => xs.filter(x => x.targetUserId !== targetUserId));
      } else {
        const error = await res.json();
        alert(error.error || 'Errore rimozione preferito');
      }
    } catch (error) {
      console.error('Errore rimozione preferito:', error);
      alert('Errore rimozione preferito');
    }
  };
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

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-3 flex items-center gap-3">
        <button className={`px-3 py-1.5 rounded-md border ${tab === 'preferiti' ? 'bg-gray-700 text-white border-blue-600' : 'border-gray-600 text-gray-300'}`} onClick={() => setTab('preferiti')}>Preferiti</button>
        <button className={`px-3 py-1.5 rounded-md border ${tab === 'top10' ? 'bg-gray-700 text-white border-blue-600' : 'border-gray-600 text-gray-300'}`} onClick={() => setTab('top10')}>Top 10</button>
      </div>

      {tab === "preferiti" ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-400">
            {loading ? 'Caricamento...' : `${favs.length} preferiti`}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800 shadow-sm animate-pulse">
                  <div className="w-full aspect-[3/4] bg-gray-700"></div>
                  <div className="p-2">
                    <div className="h-4 bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : favs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Non hai ancora aggiunto nessun preferito.</p>
              <p className="text-sm mt-2">Visita i profili delle escort e clicca sul cuore per aggiungerle ai preferiti!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favs.map((e, i) => (
                <div key={e.id} className="group border border-gray-600 rounded-lg overflow-hidden bg-gray-800 shadow-sm">
                  <Link href={`/escort/${e.slug}`} className="block">
                    <div className="relative w-full aspect-[3/4]">
                      <Image src={e.photo} alt={e.nome} fill className="object-cover group-hover:scale-105 transition-transform" />
                      {e.tier && e.tier !== 'STANDARD' && (
                        <div className="absolute top-2 left-2 bg-yellow-600 text-white text-xs rounded px-2 py-1">
                          {e.tier}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-2">
                    <div className="text-sm font-semibold truncate text-white">{e.nome}</div>
                    <div className="text-xs text-gray-400 truncate">{e.city}</div>
                    <div className="mt-2 flex items-center gap-1">
                      <Button variant="secondary" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
                      <Button variant="secondary" size="sm" onClick={() => move(i, 1)} disabled={i === favs.length - 1}>↓</Button>
                      <Button variant="secondary" size="sm" onClick={() => remove(e.targetUserId)}>✕</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {top10.map((e) => (
            <Link key={e.id} href={`/escort/${e.slug}`} className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800 shadow-sm relative group">
              <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">#{e.rank}</span>
              <div className="relative w-full aspect-[3/4]">
                <Image src={e.photo} alt={e.nome} fill className="object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-2">
                <div className="text-sm font-semibold truncate text-white">{e.nome}</div>
                <div className="text-xs text-gray-400 truncate">{e.city}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
