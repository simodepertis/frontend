"use client";

// Using native img to avoid any optimizer/runtime issues with dynamic uploads
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faStar, faIdBadge, faUser, faShieldHalved, faGem, faVideo, faComment, faComments } from "@fortawesome/free-solid-svg-icons";
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
  isVerified?: boolean;
  videoCount?: number;
  reviewCount?: number;
  commentCount?: number;
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
        {escort.isVerified && (
          <div title="Profilo verificato" className="absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow">
            ✓ Verificato
          </div>
        )}
        <img
          src={escort.foto?.startsWith('/uploads/') ? ('/api' + escort.foto) : escort.foto}
          alt={escort.nome}
          className="object-cover w-full h-full absolute inset-0"
          onError={(e) => { const t = e.currentTarget; if (t.src.indexOf('/placeholder.svg') === -1) t.src = '/placeholder.svg'; }}
        />
      </div>
      <div className="p-4 text-white flex-grow flex flex-col">
        <h3 className="text-lg font-bold mb-1">{escort.nome}, {escort.eta}</h3>
        <p className="text-gray-300 text-sm mb-3">{escort.citta}</p>
        <div className="mt-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faWhatsapp} className="text-2xl text-green-500" />
            {/* Iconcine video, recensioni e commenti */}
            {(escort.videoCount ?? 0) > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-black/70 text-white shadow">
                <FontAwesomeIcon icon={faVideo} className="text-sm" />
                <span>{escort.videoCount}</span>
              </div>
            )}
            {(escort.reviewCount ?? 0) > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-black/70 text-white shadow">
                <FontAwesomeIcon icon={faComment} className="text-sm" />
                <span>{escort.reviewCount}</span>
              </div>
            )}
            {(escort.commentCount ?? 0) > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-black/70 text-white shadow">
                <FontAwesomeIcon icon={faComments} className="text-sm" />
                <span>{escort.commentCount}</span>
              </div>
            )}
          </div>
          <span className="text-lg font-semibold text-white">€ {escort.prezzo}</span>
        </div>
      </div>
    </div>
  );
}
