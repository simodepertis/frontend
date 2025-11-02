"use client";

import Link from "next/link";
import { COUNTRIES_CITIES } from "@/lib/internationalCities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RicercaCittaInternazionaliPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

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

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white flex items-center gap-3">
          <FontAwesomeIcon icon={faGlobe} className="text-blue-500" />
          Ricerca Città Internazionali
        </h1>
        <p className="text-gray-300 text-lg">
          Seleziona un paese e una città per vedere le escort disponibili
        </p>
      </div>

      {/* Selettori */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Selezione Paese */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Seleziona Paese *</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedCity(""); // Reset città quando cambi paese
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
          className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faSearch} />
          Cerca Escort
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

      {/* Paesi più ricercati - Quick access */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">🔥 Paesi Più Ricercati</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['FR', 'DE', 'ES', 'UK', 'CH', 'NL', 'BE', 'AT'].map(code => {
            const country = COUNTRIES_CITIES[code];
            if (!country) return null;
            return (
              <button
                key={code}
                onClick={() => {
                  setSelectedCountry(code);
                  setSelectedCity("");
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors text-left"
              >
                <div className="font-medium">{country.name}</div>
                <div className="text-xs text-gray-400">{country.cities.length} città</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista completa paesi */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Tutti i Paesi Disponibili</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(COUNTRIES_CITIES).map(([code, data]) => (
            <Link
              key={code}
              href={`/internazionale/${code.toLowerCase()}`}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{data.name}</div>
                <div className="text-xs text-gray-400">{data.cities.length} città</div>
              </div>
              <div className="text-blue-400">→</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link 
          href="/internazionale" 
          className="inline-block text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Torna alla pagina internazionale
        </Link>
      </div>
    </main>
  );
}
