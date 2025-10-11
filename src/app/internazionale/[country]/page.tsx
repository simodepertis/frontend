"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EscortCard from "@/components/EscortCard";

const COUNTRIES: Record<string, { name: string; code: string; cities: string[] }> = {
  fr: { name: "Francia", code: "FR", cities: ["Paris","Marseille","Lyon","Toulouse","Nice","Bordeaux"] },
  de: { name: "Germania", code: "DE", cities: ["Berlin","Munich","Hamburg","Cologne","Frankfurt","Stuttgart"] },
  es: { name: "Spagna", code: "ES", cities: ["Madrid","Barcelona","Valencia","Sevilla","Bilbao","Malaga"] },
  uk: { name: "Regno Unito", code: "UK", cities: ["London","Manchester","Birmingham","Leeds","Liverpool","Glasgow"] },
  ch: { name: "Svizzera", code: "CH", cities: ["Zurich","Geneva","Basel","Lausanne","Lugano","Bern"] },
  nl: { name: "Olanda", code: "NL", cities: ["Amsterdam","Rotterdam","The Hague","Utrecht","Eindhoven"] },
  be: { name: "Belgio", code: "BE", cities: ["Brussels","Antwerp","Ghent","Liège"] },
  it: { name: "Italia", code: "IT", cities: ["Roma","Milano","Napoli","Torino","Bologna","Firenze"] },
};

export default function CountryPage({ params }: { params: { country: string } }) {
  const countryInfo = COUNTRIES[params.country] || COUNTRIES.fr;
  const [escorts, setEscorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url = `/api/public/annunci?country=${countryInfo.code}`;
        console.log(`🔍 Chiamata API per ${countryInfo.name}:`, url);
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          console.log(`🔍 Risposta API per ${countryInfo.name}:`, data.items?.length || 0, 'escort trovate');
          setEscorts(data.items || []);
        } else {
          console.log(`❌ Errore API per ${countryInfo.name}:`, res.status);
          setEscorts([]);
        }
      } catch (err) {
        console.log(`❌ Errore fetch per ${countryInfo.name}:`, err);
        setEscorts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [countryInfo.code]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/internazionale" className="text-blue-400 hover:underline">Internazionale</Link>
        <span className="text-gray-500 mx-2">›</span>
        <span className="text-white">{countryInfo.name}</span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">Escort in {countryInfo.name}</h1>
      <p className="text-gray-300 mb-6">Scopri le migliori escort in {countryInfo.name}. Profili verificati e contatti sicuri.</p>

      {/* Città popolari */}
      <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="text-white font-semibold mb-3">Città popolari in {countryInfo.name}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {countryInfo.cities.map((city: string) => (
            <Link key={city} href={`/internazionale/${params.country}/${city.toLowerCase()}`} className="text-left text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline text-sm">
              {city}
            </Link>
          ))}
        </div>
      </div>

      {/* Risultati escort */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Escort in {countryInfo.name} {!loading && `(${escorts.length})`}
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Caricamento escort in {countryInfo.name}...</div>
          </div>
        ) : escorts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">Nessuna escort trovata in {countryInfo.name}</div>
            <div className="text-sm text-gray-500">Prova a selezionare un altro paese o torna alla pagina principale</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {escorts.map((escort: any) => (
              <Link key={escort.id} href={`/escort/${escort.slug}`}>
                <EscortCard escort={{
                  id: escort.id,
                  nome: escort.name,
                  eta: 25,
                  citta: Array.isArray(escort.cities) && escort.cities[0] ? String(escort.cities[0]) : countryInfo.name,
                  prezzo: escort.price || 0,
                  foto: escort.coverUrl || '/placeholder.svg',
                  rank: escort.tier,
                  isVerified: escort.isVerified
                }} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Altri paesi */}
      <div className="mt-8">
        <div className="text-white font-semibold mb-3">Scopri altri paesi</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COUNTRIES).filter(([code]) => code !== params.country).map(([code, info]) => (
            <Link key={code} href={`/internazionale/${code}`} className="px-3 py-1 rounded-full border border-gray-600 text-gray-300 hover:border-blue-600 hover:text-white text-sm">
              {info.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

