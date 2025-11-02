"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EscortCard from "@/components/EscortCard";
import { COUNTRIES_CITIES } from "@/lib/internationalCities";

// Mappa slug -> dati paese
const COUNTRY_SLUG_MAP: Record<string, { name: string; code: string; cities: string[] }> = {
  fr: { name: "Francia", code: "FR", cities: COUNTRIES_CITIES.FR.cities },
  de: { name: "Germania", code: "DE", cities: COUNTRIES_CITIES.DE.cities },
  es: { name: "Spagna", code: "ES", cities: COUNTRIES_CITIES.ES.cities },
  uk: { name: "Regno Unito", code: "UK", cities: COUNTRIES_CITIES.UK.cities },
  ch: { name: "Svizzera", code: "CH", cities: COUNTRIES_CITIES.CH.cities },
  nl: { name: "Olanda", code: "NL", cities: COUNTRIES_CITIES.NL.cities },
  be: { name: "Belgio", code: "BE", cities: COUNTRIES_CITIES.BE.cities },
  at: { name: "Austria", code: "AT", cities: COUNTRIES_CITIES.AT.cities },
  pt: { name: "Portogallo", code: "PT", cities: COUNTRIES_CITIES.PT.cities },
  pl: { name: "Polonia", code: "PL", cities: COUNTRIES_CITIES.PL.cities },
  cz: { name: "Repubblica Ceca", code: "CZ", cities: COUNTRIES_CITIES.CZ.cities },
  hu: { name: "Ungheria", code: "HU", cities: COUNTRIES_CITIES.HU.cities },
  ro: { name: "Romania", code: "RO", cities: COUNTRIES_CITIES.RO.cities },
  gr: { name: "Grecia", code: "GR", cities: COUNTRIES_CITIES.GR.cities },
  ie: { name: "Irlanda", code: "IE", cities: COUNTRIES_CITIES.IE.cities },
  se: { name: "Svezia", code: "SE", cities: COUNTRIES_CITIES.SE.cities },
  no: { name: "Norvegia", code: "NO", cities: COUNTRIES_CITIES.NO.cities },
  dk: { name: "Danimarca", code: "DK", cities: COUNTRIES_CITIES.DK.cities },
  fi: { name: "Finlandia", code: "FI", cities: COUNTRIES_CITIES.FI.cities },
};

export default function CountryCityPage({ params }: { params: { country: string; city: string } }) {
  const countryInfo = COUNTRY_SLUG_MAP[params.country] || COUNTRY_SLUG_MAP.fr;
  const cityName = params.city.charAt(0).toUpperCase() + params.city.slice(1);
  const [escorts, setEscorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/annunci?country=${countryInfo.code}&citta=${cityName}`);
        if (res.ok) {
          const data = await res.json();
          setEscorts(data.items || []);
        } else {
          setEscorts([]);
        }
      } catch {
        setEscorts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [countryInfo.code, cityName]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/internazionale" className="text-blue-400 hover:underline">Internazionale</Link>
        <span className="text-gray-500 mx-2">›</span>
        <Link href={`/internazionale/${params.country}`} className="text-blue-400 hover:underline">{countryInfo.name}</Link>
        <span className="text-gray-500 mx-2">›</span>
        <span className="text-white">{cityName}</span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">Escort a {cityName}</h1>
      <p className="text-gray-300 mb-6">Scopri le migliori escort a {cityName}, {countryInfo.name}. Profili verificati e contatti sicuri.</p>

      {/* Risultati escort */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Escort a {cityName} {!loading && `(${escorts.length})`}
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Caricamento escort a {cityName}...</div>
          </div>
        ) : escorts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">Nessuna escort trovata a {cityName}</div>
            <div className="text-sm text-gray-500">Prova a selezionare un'altra città o torna alla pagina del paese</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {escorts.map((escort: any) => (
              <Link key={escort.id} href={`/escort/${escort.slug}`}>
                <EscortCard escort={{
                  id: escort.id,
                  nome: escort.name,
                  eta: 25,
                  citta: cityName,
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

      {/* Altre città del paese */}
      <div className="mb-8">
        <div className="text-white font-semibold mb-3">Altre città in {countryInfo.name}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {countryInfo.cities.filter(city => city.toLowerCase() !== params.city).map((city: string) => (
            <Link key={city} href={`/internazionale/${params.country}/${city.toLowerCase()}`} className="text-left text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline text-sm">
              {city}
            </Link>
          ))}
        </div>
      </div>

      {/* Altri paesi */}
      <div className="mt-8">
        <div className="text-white font-semibold mb-3">Scopri altri paesi</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COUNTRY_SLUG_MAP).filter(([code]) => code !== params.country).map(([code, info]) => (
            <Link key={code} href={`/internazionale/${code}`} className="px-3 py-1 rounded-full border border-gray-600 text-gray-300 hover:border-blue-600 hover:text-white text-sm">
              {info.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

