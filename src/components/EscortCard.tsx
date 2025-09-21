"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faStar, faIdBadge, faUser } from "@fortawesome/free-solid-svg-icons";
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
    case "VIP": return { color: "bg-yellow-500 text-black", icon: faCrown, borderColor: "border-yellow-500" };
    case "ORO": return { color: "bg-amber-400 text-black", icon: faStar, borderColor: "border-amber-400" };
    case "ARGENTO": return { color: "bg-slate-300 text-black", icon: faIdBadge, borderColor: "border-slate-300" };
    case "TITANIUM": return { color: "bg-slate-600 text-white", icon: faUser, borderColor: "border-slate-600" };
    default: return { color: "bg-gray-200 text-black", icon: faUser, borderColor: "border-gray-200" };
  }
}

export default function EscortCard({ escort }: { escort: Escort }) {
  const rankDetails = getRankDetails(escort.rank);
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${rankDetails.borderColor} flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
      <div className="w-full h-80 relative">
        <div className={`absolute top-2 left-2 z-10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${rankDetails.color}`}>
          <FontAwesomeIcon icon={rankDetails.icon} />
          <span>{escort.rank || ""}</span>
        </div>
        <Image src={escort.foto} alt={escort.nome} fill className="object-cover w-full h-full" sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
      <div className="p-4 text-neutral-800 flex-grow flex flex-col">
        <h3 className="text-lg font-bold mb-1">{escort.nome}, {escort.eta}</h3>
        <p className="text-neutral-500 text-sm mb-3">{escort.citta}</p>
        <div className="mt-auto flex justify-between items-center">
          <FontAwesomeIcon icon={faWhatsapp} className="text-2xl text-green-500" />
          <span className="text-lg font-semibold text-neutral-800">€ {escort.prezzo}</span>
        </div>
      </div>
    </div>
  );
}
