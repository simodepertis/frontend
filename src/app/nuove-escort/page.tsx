"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import EscortCard from "@/components/EscortCard";

export default function NuoveEscortPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        // Usa l'endpoint pubblico degli annunci (ordinati per priorità e updatedAt)
        const res = await fetch('/api/public/annunci?page=1');
        if (!res.ok) throw new Error('Errore caricamento annunci');
        const data = await res.json();
        setItems((data?.items || []).slice(0, 24));
      } catch (e: any) {
        setError(e?.message || 'Errore');
      } finally { setLoading(false); }
    })();
  }, []);

  const gridItems = useMemo(() => items.map((it: any) => ({
    id: it.id,
    nome: it.name,
    eta: 25,
    citta: Array.isArray(it.cities) && it.cities[0] ? String(it.cities[0]) : '—',
    capelli: '',
    prezzo: 0,
    foto: it.coverUrl || '/placeholder.svg',
    rank: it.tier,
    isVerified: Boolean(it.isVerified),
    slug: it.slug,
  })), [items]);

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">Nuove Escort</h1>
        <Link href="/annunci" className="text-blue-400 underline">Vedi tutti gli annunci »</Link>
      </div>
      <p className="text-gray-300 mb-6">Scopri gli ultimi profili pubblicati o aggiornati di recente.</p>

      {loading ? (
        <div className="text-gray-400">Caricamento…</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : gridItems.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-300">Nessun profilo disponibile al momento.</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {gridItems.map((e:any) => (
            <Link key={e.id} href={`/escort/${e.slug}`}>
              <EscortCard escort={e} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
