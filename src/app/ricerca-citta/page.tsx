"use client";

import { useState, useEffect } from "react";
import ITALIAN_CITIES from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faMapMarkerAlt, faFilter } from "@fortawesome/free-solid-svg-icons";
import EscortCard from "@/components/EscortCard";
import Link from "next/link";

// Lista centralizzata di città
const cittaItaliane = ITALIAN_CITIES;

export default function RicercaCittaPage() {
  const [cittaSelezionata, setCittaSelezionata] = useState("");
  const [filtroEta, setFiltroEta] = useState("");
  const [filtroPrezzo, setFiltroPrezzo] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [risultati, setRisultati] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ricercaEffettuata, setRicercaEffettuata] = useState(false);

  const tipoOptions = ["Escort", "Gigolo", "Trans", "Centro Massaggi", "Gay", "Coppia"];
  const etaOptions = ["18-25", "26-30", "31-35", "36-40", "40+"];
  const prezzoOptions = ["50-100€", "100-150€", "150-200€", "200-300€", "300€+"];

  async function eseguiRicerca() {
    if (!cittaSelezionata) {
      alert("Seleziona una città per iniziare la ricerca");
      return;
    }

    setLoading(true);
    setRicercaEffettuata(true);

    try {
      // Costruisci i parametri di ricerca
      const params = new URLSearchParams({
        city: cittaSelezionata,
        page: '1',
        limit: '20'
      });

      if (filtroTipo) params.set('tipo', filtroTipo);
      if (filtroEta) params.set('eta', filtroEta);
      if (filtroPrezzo) params.set('prezzo', filtroPrezzo);

      const response = await fetch(`/api/public/search-by-city?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Errore nella ricerca');
      }

      const data = await response.json();
      console.log(`🔍 Ricerca per ${cittaSelezionata}:`, data);
      
      setRisultati(data.results || []);
    } catch (error) {
      console.error("Errore ricerca:", error);
      setRisultati([]);
      alert("Errore durante la ricerca. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white flex items-center gap-3">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-500" />
          Ricerca per Città
        </h1>
        <p className="text-gray-300 text-lg">
          Trova le migliori escort nella tua città. Ricerca avanzata con filtri personalizzati.
        </p>
      </div>

      {/* Form di Ricerca */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="text-blue-500" />
          Filtri di Ricerca
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Selezione Città */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Città *</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={cittaSelezionata}
              onChange={(e) => setCittaSelezionata(e.target.value)}
            >
              <option value="">Seleziona città</option>
              {cittaItaliane.map((citta) => (
                <option key={citta} value={citta}>{citta}</option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Tipo</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Tutti i tipi</option>
              {tipoOptions.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Filtro Età */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Età</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroEta}
              onChange={(e) => setFiltroEta(e.target.value)}
            >
              <option value="">Tutte le età</option>
              {etaOptions.map((eta) => (
                <option key={eta} value={eta}>{eta} anni</option>
              ))}
            </select>
          </div>

          {/* Filtro Prezzo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Prezzo</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroPrezzo}
              onChange={(e) => setFiltroPrezzo(e.target.value)}
            >
              <option value="">Tutti i prezzi</option>
              {prezzoOptions.map((prezzo) => (
                <option key={prezzo} value={prezzo}>{prezzo}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottone Ricerca */}
        <Button
          onClick={eseguiRicerca}
          disabled={!cittaSelezionata || loading}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3"
        >
          <FontAwesomeIcon icon={faSearch} className="mr-2" />
          {loading ? "Ricerca in corso..." : "Cerca Escort"}
        </Button>
      </div>

      {/* Città Popolari - Link Rapidi */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Città Popolari</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {cittaItaliane.slice(0, 12).map((citta) => (
            <button
              key={citta}
              onClick={() => {
                setCittaSelezionata(citta);
                setTimeout(eseguiRicerca, 100);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              {citta}
            </button>
          ))}
        </div>
      </div>

      {/* Risultati */}
      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Ricerca in corso per {cittaSelezionata}...</p>
        </div>
      )}

      {ricercaEffettuata && !loading && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Risultati per {cittaSelezionata}
            {risultati.length > 0 && (
              <span className="text-gray-400 font-normal ml-2">
                ({risultati.length} {risultati.length === 1 ? 'risultato' : 'risultati'})
              </span>
            )}
          </h3>

          {risultati.length === 0 ? (
            <div className="text-center py-10 bg-gray-900 rounded-lg">
              <p className="text-gray-400 text-lg mb-4">
                Nessun risultato trovato per {cittaSelezionata}
              </p>
              <p className="text-gray-500 text-sm">
                Prova a modificare i filtri o seleziona un'altra città
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {risultati.map((escort) => (
                <EscortCard key={escort.id} escort={escort} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Call to Action */}
      {!ricercaEffettuata && (
        <div className="text-center py-12 bg-gray-900 rounded-lg">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-4xl text-blue-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Inizia la tua ricerca</h3>
          <p className="text-gray-400 mb-4">Seleziona una città e scopri le escort disponibili</p>
          <p className="text-sm text-gray-500">
            Oltre 30 città disponibili • Filtri avanzati • Risultati verificati
          </p>
        </div>
      )}
    </main>
  );
}
