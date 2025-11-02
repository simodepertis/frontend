"use client";

import Link from "next/link";
import { COUNTRIES_CITIES } from "@/lib/internationalCities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export default function RicercaCittaInternazionaliPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  // Filtra paesi e città in base alla ricerca
  const filteredData = Object.entries(COUNTRIES_CITIES)
    .filter(([code, data]) => {
      if (selectedCountry && code !== selectedCountry) return false;
      if (!searchTerm) return true;
      
      const search = searchTerm.toLowerCase();
      return (
        data.name.toLowerCase().includes(search) ||
        data.cities.some(city => city.toLowerCase().includes(search))
      );
    });

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white flex items-center gap-3">
          <FontAwesomeIcon icon={faGlobe} className="text-blue-500" />
          Tutte le Città Internazionali
        </h1>
        <p className="text-gray-300 text-lg">
          Esplora tutte le città disponibili per paese
        </p>
      </div>

      {/* Filtri */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ricerca per nome */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Cerca città o paese</label>
            <input
              type="text"
              placeholder="Es. Paris, Francia, Berlin..."
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro per paese */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Filtra per paese</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">Tutti i paesi</option>
              {Object.entries(COUNTRIES_CITIES).map(([code, data]) => (
                <option key={code} value={code}>{data.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset filtri */}
        {(searchTerm || selectedCountry) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCountry("");
            }}
            className="mt-4 text-sm text-blue-400 hover:text-blue-300"
          >
            ✕ Cancella filtri
          </button>
        )}
      </div>

      {/* Lista città per paese */}
      <div className="space-y-8">
        {filteredData.map(([code, data]) => (
          <div key={code} className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Link 
                href={`/internazionale/${code.toLowerCase()}`}
                className="text-2xl font-bold text-white hover:text-blue-400 transition-colors"
              >
                {data.name}
              </Link>
              <span className="text-gray-400 text-sm">({data.cities.length} città)</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {data.cities
                .filter(city => {
                  if (!searchTerm) return true;
                  return city.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map((city) => (
                  <Link
                    key={city}
                    href={`/internazionale/${code.toLowerCase()}/${city.toLowerCase()}`}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-400 text-xs" />
                    {city}
                  </Link>
                ))}
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-lg mb-2">
              Nessuna città trovata
            </p>
            <p className="text-gray-500 text-sm">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        )}
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
