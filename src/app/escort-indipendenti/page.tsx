"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faUserCheck, faStar } from "@fortawesome/free-solid-svg-icons";
import EscortCard from "@/components/EscortCard";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";

export default function EscortIndipendentiPage() {
  const [escorts, setEscorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCitta, setFiltroCitta] = useState("");
  const [filtroCapelli, setFiltroCapelli] = useState("");
  const [filtroEta, setFiltroEta] = useState("");
  const [filtroPrezzo, setFiltroPrezzo] = useState("");

  // Opzioni per i filtri
  const cittaOptions = ["Milano", "Roma", "Napoli", "Torino", "Firenze", "Bologna", "Bari", "Palermo"];
  const capelliOptions = ["Biondi", "Castani", "Neri", "Rossi"];
  const etaOptions = ["18-25", "26-30", "31-35", "36-40", "40+"];
  const prezzoOptions = ["50-100", "100-150", "150-200", "200-300", "300+"];

  useEffect(() => {
    loadEscortIndipendenti();
  }, []);

  async function loadEscortIndipendenti() {
    try {
      // Chiamata API reale
      const response = await fetch('/api/public/escort-indipendenti');
      
      if (!response.ok) {
        throw new Error('Errore caricamento escort');
      }
      
      const data = await response.json();
      
      if (data.success && data.escorts && data.escorts.length > 0) {
        // Filtra solo escort verificati con pacchetto attivo
        const escortsVerificati = data.escorts.filter(escort => 
          escort.verificata && escort.pacchettoAttivo
        );
        setEscorts(escortsVerificati);
        return;
      }
      
      // NESSUN DATO MOCK - Solo utenti reali verificati
      console.log('ℹ️ Nessun escort indipendente verificato trovato');
      setEscorts([]);
    } catch (error) {
      console.error('❌ Errore caricamento escort indipendenti:', error);
    } finally {
      setLoading(false);
    }
  }

  // Funzione di filtro
  const escortsFiltrate = escorts.filter((escort) => {
    const matchCitta = !filtroCitta || escort.citta === filtroCitta;
    const matchCapelli = !filtroCapelli || escort.capelli === filtroCapelli;
    
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
    
    const matchPrezzo = !filtroPrezzo || (() => {
      const prezzo = escort.prezzo;
      switch(filtroPrezzo) {
        case "50-100": return prezzo >= 50 && prezzo <= 100;
        case "100-150": return prezzo >= 100 && prezzo <= 150;
        case "150-200": return prezzo >= 150 && prezzo <= 200;
        case "200-300": return prezzo >= 200 && prezzo <= 300;
        case "300+": return prezzo > 300;
        default: return true;
      }
    })();
    
    return matchCitta && matchCapelli && matchEta && matchPrezzo;
  });

  // Ordina per rank (VIP > ORO > TITANIUM > ARGENTO)
  const rankOrder = { "VIP": 1, "ORO": 2, "TITANIUM": 3, "ARGENTO": 4 };
  const escortsOrdinati = escortsFiltrate.sort((a, b) => {
    const rankA = rankOrder[a.rank as keyof typeof rankOrder] || 5;
    const rankB = rankOrder[b.rank as keyof typeof rankOrder] || 5;
    return rankA - rankB;
  });

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white flex items-center gap-3">
          <FontAwesomeIcon icon={faUserCheck} className="text-blue-500" />
          Escort Indipendenti
        </h1>
        <p className="text-gray-300 text-lg">
          Scopri le migliori escort indipendenti verificate nella tua città. 
          Professioniste autonome che lavorano in totale indipendenza.
        </p>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUserCheck} className="text-green-500" />
            {escorts.filter(e => e.verificata).length} Verificate
          </span>
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
            {escorts.length} Totali
          </span>
        </div>
      </div>

      {/* Filtri */}
      <FilterBar 
        title="Trova la tua escort indipendente ideale" 
        actions={
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-2 h-auto rounded-md">
            <FontAwesomeIcon icon={faSearch} className="mr-2"/>
            Cerca ({escortsOrdinati.length})
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro Città */}
          <div className="flex flex-col gap-1">
            <label htmlFor="citta" className="text-sm font-medium text-white">Città</label>
            <select
              id="citta"
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroCitta}
              onChange={(e) => setFiltroCitta(e.target.value)}
            >
              <option value="">Tutte le città</option>
              {cittaOptions.map((citta) => (
                <option key={citta} value={citta}>{citta}</option>
              ))}
            </select>
          </div>

          {/* Filtro Capelli */}
          <div className="flex flex-col gap-1">
            <label htmlFor="capelli" className="text-sm font-medium text-white">Capelli</label>
            <select
              id="capelli"
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroCapelli}
              onChange={(e) => setFiltroCapelli(e.target.value)}
            >
              <option value="">Tutti i colori</option>
              {capelliOptions.map((capelli) => (
                <option key={capelli} value={capelli}>{capelli}</option>
              ))}
            </select>
          </div>

          {/* Filtro Età */}
          <div className="flex flex-col gap-1">
            <label htmlFor="eta" className="text-sm font-medium text-white">Età</label>
            <select
              id="eta"
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
          <div className="flex flex-col gap-1">
            <label htmlFor="prezzo" className="text-sm font-medium text-white">Prezzo</label>
            <select
              id="prezzo"
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroPrezzo}
              onChange={(e) => setFiltroPrezzo(e.target.value)}
            >
              <option value="">Tutti i prezzi</option>
              {prezzoOptions.map((prezzo) => (
                <option key={prezzo} value={prezzo}>{prezzo}€</option>
              ))}
            </select>
          </div>
        </div>
      </FilterBar>

      {/* Risultati */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento escort indipendenti...</p>
        </div>
      ) : escortsOrdinati.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 text-lg">Nessuna escort indipendente trovata con i filtri selezionati.</p>
          <Button 
            onClick={() => {
              setFiltroCitta("");
              setFiltroCapelli("");
              setFiltroEta("");
              setFiltroPrezzo("");
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Rimuovi filtri
          </Button>
        </div>
      ) : (
        <>
          {/* Info risultati */}
          <div className="mb-6 text-gray-300">
            <p>Trovate <strong className="text-white">{escortsOrdinati.length}</strong> escort indipendenti</p>
          </div>

          {/* Griglia escort */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {escortsOrdinati.map((escort) => (
              <Link key={escort.id} href={`/escort/${escort.slug}`} className="relative block">
                <EscortCard escort={{ id: escort.id, nome: escort.nome, eta: escort.eta, citta: escort.citta, prezzo: escort.prezzo, foto: escort.foto, rank: escort.rank, isVerified: escort.verificata }} />
                {/* Badge Indipendente */}
                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
                  Indipendente
                </div>
                {/* Badge Verificata */}
                {escort.verificata && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
                    Verificata
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
