"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
import EscortCard from "@/components/EscortCard";
import FilterBar from "@/components/FilterBar";

// Dati di esempio (mock data) per i profili
const escorts = [
  { id: 1, nome: "Giulia", eta: 25, citta: "Milano", capelli: "Biondi", prezzo: 150, foto: "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5", rank: "VIP" },
  { id: 2, nome: "Martina", eta: 28, citta: "Roma", capelli: "Castani", prezzo: 200, foto: "https://i.escortforumit.xxx/710869/profile/9c6cc2e7-5ad8-4684-bd96-fdfcfd6faa58_thumb_750.jpg?v=1", rank: "ORO" },
  { id: 3, nome: "Sara", eta: 23, citta: "Firenze", capelli: "Neri", prezzo: 180, foto: "https://i.escortforumit.xxx/376078/profile/190aa487-a2dd-43ee-a4c2-5dff8c5fab49_thumb_750.jpg?v=1", rank: "ARGENTO" },
  { id: 4, nome: "Elena", eta: 26, citta: "Milano", capelli: "Neri", prezzo: 180, foto: "https://i.escortforumit.xxx/703461/profile/28a91e4c-c6c3-4639-bae9-aeab4cbad15c_thumb_750.jpg?v=1", rank: "TITANIUM" },
  { id: 5, nome: "Sofia", eta: 29, citta: "Roma", capelli: "Biondi", prezzo: 220, foto: "https://i.escortforumit.xxx/686141/profile/80cb7136-bcc1-4c01-9430-b8cbedd43a21_thumb_750.jpg?v=1", rank: "VIP" },
  { id: 6, nome: "Chiara", eta: 22, citta: "Firenze", capelli: "Castani", prezzo: 160, foto: "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1", rank: "ORO" },
];

const cittaOptions = ["Milano", "Roma", "Firenze"];
const capelliOptions = ["Biondi", "Castani", "Neri"];

// Nuove iscritte (mock): prendi alcune escort e marca come NEW
const recentEscorts = escorts.slice(0, 10).map((e) => ({
  ...e,
  isNew: true,
  slug: `${e.nome}-${e.citta}`.toLowerCase().replace(/\s+/g, '-'),
}));

export default function Home() {
  const [filtroCitta, setFiltroCitta] = useState("");
  const [filtroCapelli, setFiltroCapelli] = useState("");

  const escortsFiltrate = escorts.filter((e) => {
    return (!filtroCitta || e.citta === filtroCitta) && (!filtroCapelli || e.capelli === filtroCapelli);
  });

  return (
    <main className="flex flex-col min-h-[calc(100vh-80px)] container mx-auto px-4 py-8">
      
      {/* SEZIONE FILTRI DI RICERCA */}
      <FilterBar title="Trova la tua compagnia ideale" actions={
        <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-2 h-auto rounded-md">
          <FontAwesomeIcon icon={faSearch} className="mr-2"/>
          Cerca
        </Button>
      }>
        <div className="flex flex-col gap-1">
          <label htmlFor="citta" className="text-sm font-medium text-neutral-600">Città</label>
          <select
            id="citta"
            className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filtroCitta}
            onChange={(e) => setFiltroCitta(e.target.value)}
          >
            <option value="">Tutte le città</option>
            {cittaOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
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

      {/* STRIP NUOVE ISCRITTE */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-neutral-800">Nuove iscritte</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {recentEscorts.map((p) => (
            <Link key={p.slug} href={`/escort/${p.slug}`} className="shrink-0">
              <div className="w-16">
                <div className="relative w-16 h-16 rounded-full ring-2 ring-red-200 hover:ring-red-400 transition overflow-hidden">
                  <Image src={p.foto} alt={p.nome} fill className="object-cover" />
                </div>
                {p.isNew && (
                  <div className="mt-1 w-full flex justify-center">
                    <span className="inline-flex items-center justify-center px-2 h-5 text-[10px] font-extrabold leading-none tracking-tight bg-red-600 text-white rounded-full shadow">
                      NEW
                    </span>
                  </div>
                )}
                <div className="w-16 truncate text-[11px] text-center mt-1 text-neutral-700">{p.nome}</div>
              </div>
            </Link>
          ))}
          </div>
        </div>
      </div>

      {/* GRIGLIA PROFILI */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 flex-grow">
        {escortsFiltrate.length === 0 && (
          <div className="col-span-full text-center text-neutral-500 py-10">
            Nessun risultato trovato. Prova a modificare i filtri.
          </div>
        )}
        {escortsFiltrate.map((escort) => (
          <EscortCard key={escort.id} escort={escort} />
        ))}
      </div>

    </main>
  );
}
