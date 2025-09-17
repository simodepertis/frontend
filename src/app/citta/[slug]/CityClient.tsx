"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCrown, faStar, faIdBadge, faUser } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

// Mock data come in home/escort pages
const escorts = [
  { id: 1, nome: "Giulia", eta: 25, citta: "Milano", capelli: "Biondi", prezzo: 150, foto: "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5", rank: "VIP" },
  { id: 2, nome: "Martina", eta: 28, citta: "Roma", capelli: "Castani", prezzo: 200, foto: "https://i.escortforumit.xxx/710869/profile/9c6cc2e7-5ad8-4684-bd96-fdfcfd6faa58_thumb_750.jpg?v=1", rank: "ORO" },
  { id: 3, nome: "Sara", eta: 23, citta: "Firenze", capelli: "Neri", prezzo: 180, foto: "https://i.escortforumit.xxx/376078/profile/190aa487-a2dd-43ee-a4c2-5dff8c5fab49_thumb_750.jpg?v=1", rank: "ARGENTO" },
  { id: 4, nome: "Elena", eta: 26, citta: "Milano", capelli: "Neri", prezzo: 180, foto: "https://i.escortforumit.xxx/703461/profile/28a91e4c-c6c3-4639-bae9-aeab4cbad15c_thumb_750.jpg?v=1", rank: "TITANIUM" },
  { id: 5, nome: "Sofia", eta: 29, citta: "Roma", capelli: "Biondi", prezzo: 220, foto: "https://i.escortforumit.xxx/686141/profile/80cb7136-bcc1-4c01-9430-b8cbedd43a21_thumb_750.jpg?v=1", rank: "VIP" },
  { id: 6, nome: "Chiara", eta: 22, citta: "Firenze", capelli: "Castani", prezzo: 160, foto: "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1", rank: "ORO" },
];

const capelliOptions = ["Biondi", "Castani", "Neri"];

const getRankDetails = (rank: string) => {
  switch (rank) {
    case "VIP": return { color: "bg-yellow-500 text-black", icon: faCrown, borderColor: "border-yellow-500" };
    case "ORO": return { color: "bg-amber-400 text-black", icon: faStar, borderColor: "border-amber-400" };
    case "ARGENTO": return { color: "bg-slate-300 text-black", icon: faIdBadge, borderColor: "border-slate-300" };
    case "TITANIUM": return { color: "bg-slate-600 text-white", icon: faUser, borderColor: "border-slate-600" };
    default: return { color: "bg-gray-200 text-black", icon: faUser, borderColor: "border-gray-200" };
  }
}

export default function CityClient({ city }: { city: string }) {
  const [filtroCapelli, setFiltroCapelli] = useState("");

  const escortsFiltrate = useMemo(() => {
    return escorts.filter((e) => {
      return e.citta.toLowerCase() === city.toLowerCase() && (!filtroCapelli || e.capelli === filtroCapelli);
    });
  }, [city, filtroCapelli]);

  return (
    <>
      {/* Filtro stile home (solo capelli perché città fissata) */}
      <div className="mb-10 p-6 bg-neutral-100 rounded-lg shadow-md border">
        <h2 className="text-xl font-bold text-neutral-800 mb-4 text-center">Filtra risultati</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-2 h-auto rounded-md">
            <FontAwesomeIcon icon={faSearch} className="mr-2"/>
            Cerca
          </Button>
        </div>
      </div>

      {/* Griglia risultati */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 flex-grow">
        {escortsFiltrate.length === 0 && (
          <div className="col-span-full text-center text-neutral-500 py-10">
            Nessun risultato trovato per {city}.
          </div>
        )}
        {escortsFiltrate.map((escort) => {
          const rankDetails = getRankDetails(escort.rank);
          const slug = `${escort.nome}-${escort.citta}`.toLowerCase().replace(/\s+/g, '-');
          return (
            <Link href={`/escort/${slug}`} key={escort.id} className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${rankDetails.borderColor} flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
              <div className="w-full h-80 relative">
                <div className={`absolute top-2 left-2 z-10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${rankDetails.color}`}>
                  <FontAwesomeIcon icon={rankDetails.icon} />
                  <span>{escort.rank}</span>
                </div>
                <Image src={escort.foto} alt={escort.nome} fill className="object-cover w-full h-full" />
              </div>
              <div className="p-4 text-neutral-800 flex-grow flex flex-col">
                <h3 className="text-lg font-bold mb-1">{escort.nome}, {escort.eta}</h3>
                <p className="text-neutral-500 text-sm mb-3">{escort.citta}</p>
                <div className="mt-auto flex justify-between items-center">
                  <FontAwesomeIcon icon={faWhatsapp} className="text-2xl text-green-500" />
                  <span className="text-lg font-semibold text-neutral-800">€ {escort.prezzo}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
