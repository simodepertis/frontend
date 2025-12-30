"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EscortCard from "@/components/EscortCard";
import SeoHead from "@/components/SeoHead";

function kebab(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'');
}

export default function CercaPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/public/annunci?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Errore ricerca:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Cerca | Incontriescort.org"
        description="Cerca annunci e profili per nome, città e preferenze."
        canonicalPath="/cerca"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          name: "Cerca",
          url: (process.env.NEXT_PUBLIC_SITE_URL || "https://incontriescort.org") + "/cerca",
        }}
      />
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Cerca</h1>
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 shadow-lg mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            placeholder="Cerca per nome, città, preferenze..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md px-6 py-3 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {loading ? "Cercando..." : "Cerca"}
          </button>
        </form>
      </div>

      {/* Risultati */}
      {searched && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">
            {loading ? "Ricerca in corso..." : `${results.length} risultati per "${q}"`}
          </h2>
          
          {results.length === 0 && !loading ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">Nessun risultato trovato</p>
              <p className="text-sm">Prova con termini di ricerca diversi</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {results.map((escort: any) => (
                <Link key={escort.id} href={`/escort/${escort.slug || `${kebab(escort.name)}-${escort.id}`}`}>
                  <EscortCard escort={{ 
                    id: escort.id, 
                    nome: escort.name, 
                    eta: 25, 
                    citta: Array.isArray(escort.cities) && escort.cities[0] ? String(escort.cities[0]) : '—', 
                    capelli: '', 
                    prezzo: 0, 
                    foto: escort.coverUrl || "/placeholder.svg", 
                    rank: escort.tier 
                  }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
    </>
  );
}
