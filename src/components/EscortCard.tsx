"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faStar, faIdBadge, faUser, faShieldHalved, faGem } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

export type Escort = {
  id: number;
  nome: string;
  eta: number;
  citta: string;
  capelli?: string;
  prezzo: number;
  foto: string;
  rank?: "VIP" | "ORO" | "ARGENTO" | "TITANIUM" | string;
};

function getRankDetails(rank?: string) {
  switch (rank) {
    case "VIP": return { 
      color: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold", 
      icon: faCrown, 
      borderColor: "border-yellow-400 shadow-yellow-400/50" 
    };
    case "TITANIO": return { 
      color: "bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold", 
      icon: faShieldHalved, 
      borderColor: "border-blue-500 shadow-blue-500/50" 
    };
    case "ORO": return { 
      color: "bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold", 
      icon: faStar, 
      borderColor: "border-amber-400 shadow-amber-400/50" 
    };
    case "ARGENTO": return { 
      color: "bg-gradient-to-r from-gray-300 to-gray-500 text-black font-bold", 
      icon: faGem, 
      borderColor: "border-gray-400 shadow-gray-400/50" 
    };
    default: return { 
      color: "bg-gray-600 text-white", 
      icon: faUser, 
      borderColor: "border-gray-600" 
    };
  }
}

export default function EscortCard({ escort }: { escort: Escort }) {
  const rankDetails = getRankDetails(escort.rank);
  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 ${rankDetails.borderColor} flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
      <div className="w-full h-80 relative">
        <div className={`absolute top-2 left-2 z-10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${rankDetails.color}`}>
          <FontAwesomeIcon icon={rankDetails.icon} />
          <span>{escort.rank || ""}</span>
        </div>
        <Image src={escort.foto} alt={escort.nome} fill className="object-cover w-full h-full" sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
      <div className="p-4 text-white flex-grow flex flex-col">
        <h3 className="text-lg font-bold mb-1">{escort.nome}, {escort.eta}</h3>
        <p className="text-gray-300 text-sm mb-3">{escort.citta}</p>
        <div className="mt-auto flex justify-between items-center">
          <FontAwesomeIcon icon={faWhatsapp} className="text-2xl text-green-500" />
          <span className="text-lg font-semibold text-white">€ {escort.prezzo}</span>
        </div>
      </div>
    </div>
  );
}
