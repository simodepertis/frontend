"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import EscortCard from "@/components/EscortCard";
import FilterBar from "@/components/FilterBar";
import { escorts as allEscorts } from "@/lib/mock";

export default function CityClient({ city }: { city: string }) {
  const [filtroCapelli, setFiltroCapelli] = useState("");
  const capelliOptions = ["Biondi", "Castani", "Neri"];

  const escortsFiltrate = useMemo(() => {
    return allEscorts.filter((e) => {
      return e.city.toLowerCase() === city.toLowerCase() && (!filtroCapelli || e.capelli === filtroCapelli);
    });
  }, [city, filtroCapelli]);

  return (
    <>
      {/* FilterBar: solo capelli perché la città è fissata dal contesto */}
      <FilterBar title={`Escort a ${city}`} actions={
        <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-2 h-auto rounded-md">
          <FontAwesomeIcon icon={faSearch} className="mr-2"/>
          Cerca
        </Button>
      }>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label htmlFor="capelli" className="text-sm font-medium text-neutral-600">Colore Capelli</label>
          <select
            id="capelli"
            className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filtroCapelli}
            onChange={(e) => setFiltroCapelli(e.target.value)}
          >
            <option value="">Tutti i capelli</option>
            {capelliOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </FilterBar>

      {/* Griglia risultati */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 flex-grow">
        {escortsFiltrate.length === 0 && (
          <div className="col-span-full text-center text-neutral-500 py-10">
            Nessun risultato trovato per {city}.
          </div>
        )}
        {escortsFiltrate.map((escort) => (
          <EscortCard key={escort.id} escort={{
            id: escort.id,
            nome: escort.nome,
            eta: escort.eta,
            citta: escort.city,
            capelli: escort.capelli || "",
            prezzo: escort.prezzo || 0,
            foto: escort.photo,
            rank: escort.tier,
          }} />
        ))}
      </div>
    </>
  );
}

