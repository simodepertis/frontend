"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EscortCard from "@/components/EscortCard";
import { COUNTRIES_CITIES } from "@/lib/internationalCities";

const COUNTRIES: Record<string, { name: string; code: string; cities: string[] }> = {
  it: { name: "Italia", code: "IT", cities: COUNTRIES_CITIES.IT.cities },
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
  hr: { name: "Croazia", code: "HR", cities: COUNTRIES_CITIES.HR.cities },
  rs: { name: "Serbia", code: "RS", cities: COUNTRIES_CITIES.RS.cities },
  bg: { name: "Bulgaria", code: "BG", cities: COUNTRIES_CITIES.BG.cities },
  sk: { name: "Slovacchia", code: "SK", cities: COUNTRIES_CITIES.SK.cities },
  si: { name: "Slovenia", code: "SI", cities: COUNTRIES_CITIES.SI.cities },
  lu: { name: "Lussemburgo", code: "LU", cities: COUNTRIES_CITIES.LU.cities },
  li: { name: "Liechtenstein", code: "LI", cities: COUNTRIES_CITIES.LI.cities },
  lt: { name: "Lituania", code: "LT", cities: COUNTRIES_CITIES.LT.cities },
  mg: { name: "Madagascar", code: "MG", cities: COUNTRIES_CITIES.MG.cities },
  my: { name: "Malaysia", code: "MY", cities: COUNTRIES_CITIES.MY.cities },
  mt: { name: "Malta", code: "MT", cities: COUNTRIES_CITIES.MT.cities },
  mc: { name: "Monaco", code: "MC", cities: COUNTRIES_CITIES.MC.cities },
  mn: { name: "Mongolia", code: "MN", cities: COUNTRIES_CITIES.MN.cities },
  me: { name: "Montenegro", code: "ME", cities: COUNTRIES_CITIES.ME.cities },
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

