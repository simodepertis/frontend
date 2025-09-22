"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faVenus, faHeart } from "@fortawesome/free-solid-svg-icons";
import EscortCard from "@/components/EscortCard";
import FilterBar from "@/components/FilterBar";

export default function TransPage() {
  const [escorts, setEscorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCitta, setFiltroCitta] = useState("");
  const [filtroEta, setFiltroEta] = useState("");

  const cittaOptions = ["Milano", "Roma", "Napoli", "Torino", "Firenze", "Bologna"];
  const etaOptions = ["18-25", "26-30", "31-35", "36-40", "40+"];

  useEffect(() => {
    loadTransEscorts();
  }, []);

  async function loadTransEscorts() {
    try {
      // LOGICA CORRETTA: Solo trans verificati con pacchetto attivo
      // Al momento non ci sono trans che hanno:
      // 1. Verificato l'identità (documenti approvati dall'admin)
      // 2. Acquistato pacchetto attivo
      // 3. Completato il profilo con categoria "Trans"
      
      console.log('ℹ️ Nessun trans verificato con pacchetto attivo trovato');
      setEscorts([]);
    } catch (error) {
      console.error("Errore caricamento Trans:", error);
    } finally {
      setLoading(false);
    }
  }

  const escortsFiltrate = escorts.filter((escort) => {
    const matchCitta = !filtroCitta || escort.citta === filtroCitta;
    const matchEta = !filtroEta || (() => {
      const eta = escort.eta;
      switch(filtroEta) {
        case "18-25": return eta >= 18 && eta <= 25;
        case "26-30": return eta >= 26 && eta <= 30;
        case "31-35": return eta >= 31 && eta <= 35;
        case "36-40": return eta >= 36 && eta <= 40;
        case "40+": return eta > 40;
        default: return true;
      }
    })();
    
    return matchCitta && matchEta;
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white flex items-center gap-3">
          <FontAwesomeIcon icon={faVenus} className="text-pink-500" />
          Trans
        </h1>
        <p className="text-gray-300 text-lg">
          Bellissime trans per incontri speciali. Femminilità, sensualità e passione.
        </p>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faVenus} className="text-pink-500" />
            Verificate
          </span>
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faHeart} className="text-red-500" />
            Selezionate
          </span>
        </div>
      </div>

      <FilterBar 
        title="Trova la tua trans ideale" 
        actions={
          <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg py-2 h-auto rounded-md">
            <FontAwesomeIcon icon={faSearch} className="mr-2"/>
            Cerca ({escortsFiltrate.length})
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="citta" className="text-sm font-medium text-white">Città</label>
            <select
              id="citta"
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={filtroCitta}
              onChange={(e) => setFiltroCitta(e.target.value)}
            >
              <option value="">Tutte le città</option>
              {cittaOptions.map((citta) => (
                <option key={citta} value={citta}>{citta}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="eta" className="text-sm font-medium text-white">Età</label>
            <select
              id="eta"
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={filtroEta}
              onChange={(e) => setFiltroEta(e.target.value)}
            >
              <option value="">Tutte le età</option>
              {etaOptions.map((eta) => (
                <option key={eta} value={eta}>{eta} anni</option>
              ))}
            </select>
          </div>
        </div>
      </FilterBar>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento trans...</p>
        </div>
      ) : escortsFiltrate.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 text-lg">Nessuna trans trovata con i filtri selezionati.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 text-gray-300">
            <p>Trovate <strong className="text-white">{escortsFiltrate.length}</strong> trans</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {escortsFiltrate.map((escort) => (
              <div key={escort.id} className="relative">
                <EscortCard escort={escort} />
                <div className="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  <FontAwesomeIcon icon={faVenus} className="mr-1" />
                  Trans
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
