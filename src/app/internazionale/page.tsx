"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EscortCard from "@/components/EscortCard";
import { COUNTRIES_CITIES } from "@/lib/internationalCities";

export default function InternazionalePage() {
  const flags = [
    { code: "fr", label: "Francia", country: "FR", img: "/flags/fr.svg" },
    { code: "it", label: "Italia", country: "IT", img: "/flags/it.svg" },
    { code: "de", label: "Germania", country: "DE", img: "/flags/de.svg" },
    { code: "es", label: "Spagna", country: "ES", img: "/flags/es.svg" },
    { code: "gb", label: "UK", country: "UK", img: "/flags/gb.svg" },
    { code: "ch", label: "Svizzera", country: "CH", img: "/flags/ch.svg" },
    { code: "nl", label: "Olanda", country: "NL", img: "/flags/nl.svg" },
    { code: "be", label: "Belgio", country: "BE", img: "/flags/be.svg" },
  ];

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const router = useRouter();

  const availableCities = selectedCountry ? COUNTRIES_CITIES[selectedCountry]?.cities || [] : [];

  const handleSearch = () => {
    if (!selectedCountry || !selectedCity) {
      alert('Seleziona sia il paese che la città');
      return;
    }
    
    const countrySlug = selectedCountry.toLowerCase();
    const citySlug = selectedCity.toLowerCase();
    router.push(`/internazionale/${countrySlug}/${citySlug}`);
  };

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
          <Link prefetch={false} key={f.code} href={`/internazionale/${f.code}`} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-600 bg-gray-800 hover:border-blue-600">
            {/* Se non abbiamo le SVG, fallback a emoji flag */}
            <span className="text-lg">{f.code === 'fr' ? '🇫🇷' : f.code === 'it' ? '🇮🇹' : f.code === 'de' ? '🇩🇪' : f.code === 'es' ? '🇪🇸' : f.code === 'gb' ? '🇬🇧' : f.code === 'ch' ? '🇨🇭' : f.code === 'nl' ? '🇳🇱' : f.code === 'be' ? '🇧🇪' : '🏳️'}</span>
            <span className="text-sm text-white">{f.label}</span>
          </Link>
        ))}
      </div>

      {/* SELETTORI PAESE E CITTÀ */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">🌍 Cerca per Città</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Selezione Paese */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Seleziona Paese *</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedCity("");
              }}
            >
              <option value="">-- Seleziona un paese --</option>
              {Object.entries(COUNTRIES_CITIES).map(([code, data]) => (
                <option key={code} value={code}>
                  {data.name} ({data.cities.length} città)
                </option>
              ))}
            </select>
          </div>

          {/* Selezione Città */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Seleziona Città *</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedCountry}
            >
              <option value="">
                {selectedCountry ? '-- Seleziona una città --' : 'Prima seleziona un paese'}
              </option>
              {availableCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottone Cerca */}
        <button
          onClick={handleSearch}
          disabled={!selectedCountry || !selectedCity}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          🔍 Cerca Escort
        </button>

        {/* Anteprima selezione */}
        {selectedCountry && selectedCity && (
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <div className="text-sm text-blue-300">
              📍 Stai cercando escort a: <span className="font-semibold text-white">{selectedCity}, {COUNTRIES_CITIES[selectedCountry]?.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Griglia profili (stile editoriale) */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Escort in evidenza</h2>
          <Link href="/escort" className="text-sm text-blue-400 hover:underline">Vedi tutte »</Link>
        </div>
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun profilo disponibile.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.filter((e:any)=> {
              // Mostra solo escort con almeno un country code internazionale (non IT, non vuoto)
              if (!Array.isArray(e.countries) || e.countries.length === 0) return false;
              // Se ha solo IT, non mostrare
              if (e.countries.length === 1 && e.countries[0] === 'IT') return false;
              // Se ha almeno un paese diverso da IT, mostra
              return e.countries.some((c: string) => c && c !== 'IT');
            }).slice(0, 12).map((e: any) => (
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
