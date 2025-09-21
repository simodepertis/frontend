"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faUser,
  faMagnifyingGlass,
  faStar,
  faGear,
  faLifeRing,
  faBell,
  faCity,
  faHeart,
  faComments,
  faRightFromBracket,
  faIdCard,
  faCircleCheck,
  faBolt,
  faPlane,
  faBullhorn,
  faWandMagicSparkles,
  faArrowUp,
  faChartBar,
  faBan,
  faCartShopping,
  faGlobe,
  faVideo
} from "@fortawesome/free-solid-svg-icons";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setRole(data?.user?.ruolo || "");
          setEmail(data?.user?.email || "");
        }
      } catch {}
    })();
  }, []);

  const baseItems = role === "escort"
    ? [
        { href: "/dashboard/escort", label: "Dashboard Escort", icon: faGaugeHigh },
        { href: "/dashboard/mio-profilo", label: "Il Mio Profilo", icon: faUser },
        { href: "/dashboard/escort/compila", label: "Profilo Escort", icon: faIdCard },
        { href: "/dashboard/verifica-foto", label: "Verifica Foto al 100%", icon: faCircleCheck },
        { href: "/dashboard/verifica-video", label: "Verifica Video", icon: faVideo },
        { href: "/dashboard/prenotazioni", label: "Prenotazioni Istantanee", icon: faBolt },
        { href: "/dashboard/lui-cerca", label: "Lui Cerca", icon: faMagnifyingGlass },
        { href: "/dashboard/tour-citta", label: "Tour Città", icon: faPlane },
        { href: "/dashboard/pubblicita", label: "Acquista Pubblicità", icon: faBullhorn },
        { href: "/dashboard/ragazza-del-giorno", label: "Ragazza Del Giorno", icon: faWandMagicSparkles },
        { href: "/dashboard/bump-profilo", label: "Bump Profilo", icon: faArrowUp },
        { href: "/dashboard/recensioni", label: "Recensioni", icon: faStar },
        { href: "/dashboard/impostazioni", label: "Impostazioni", icon: faGear },
        { href: "/dashboard/supporto", label: "Supporto", icon: faLifeRing },
        { href: "/dashboard/statistiche", label: "Statistiche del Profilo", icon: faChartBar },
        { href: "/dashboard/crediti", label: "Crediti", icon: faBolt },
        { href: "/dashboard/lista-nera", label: "Lista Nera Clienti", icon: faBan },
        { href: "/dashboard/carrello", label: "Carrello", icon: faCartShopping },
        { href: "/dashboard/avvisi", label: "Avvisi", icon: faBell },
        { href: "/dashboard/avvisi-citta", label: "Avvisi Città", icon: faCity },
        { href: "/dashboard/preferiti", label: "Preferiti / Top 10", icon: faHeart },
        { href: "/dashboard/forum", label: "Forum", icon: faComments },
        { href: "/", label: "Vai all'Area Pubblica", icon: faGlobe },
        { href: "/autenticazione", label: "Esci", icon: faRightFromBracket },
      ]
    : role === "agency"
    ? [
        { href: "/dashboard/agenzia", label: "Dashboard Agenzia", icon: faGaugeHigh },
        { href: "/dashboard/mio-profilo", label: "Il Mio Profilo", icon: faUser },
        { href: "/dashboard/agenzia/compila", label: "Profilo Agenzia", icon: faIdCard },
        { href: "/dashboard/agenzia/escort", label: "Gestione Escort", icon: faUser },
        { href: "/dashboard/prenotazioni", label: "Prenotazioni", icon: faBolt },
        { href: "/dashboard/lui-cerca", label: "Lui Cerca", icon: faMagnifyingGlass },
        { href: "/dashboard/tour-citta", label: "Tour Città", icon: faPlane },
        { href: "/dashboard/pubblicita", label: "Acquista Pubblicità", icon: faBullhorn },
        { href: "/dashboard/recensioni", label: "Recensioni", icon: faStar },
        { href: "/dashboard/impostazioni", label: "Impostazioni", icon: faGear },
        { href: "/dashboard/supporto", label: "Supporto", icon: faLifeRing },
        { href: "/dashboard/statistiche", label: "Statistiche", icon: faChartBar },
        { href: "/dashboard/crediti", label: "Crediti", icon: faBolt },
        { href: "/dashboard/carrello", label: "Carrello", icon: faCartShopping },
        { href: "/dashboard/forum", label: "Forum", icon: faComments },
        { href: "/", label: "Vai all'Area Pubblica", icon: faGlobe },
        { href: "/autenticazione", label: "Esci", icon: faRightFromBracket },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: faGaugeHigh },
        { href: "/dashboard/mio-profilo", label: "Il Mio Profilo", icon: faUser },
        { href: "/dashboard/ricerca", label: "La Ricerca", icon: faMagnifyingGlass },
        { href: "/dashboard/recensioni", label: "Recensioni", icon: faStar },
        { href: "/dashboard/impostazioni", label: "Impostazioni", icon: faGear },
        { href: "/dashboard/crediti", label: "Crediti", icon: faBolt },
        { href: "/dashboard/supporto", label: "Supporto", icon: faLifeRing },
        { href: "/dashboard/avvisi", label: "Avvisi", icon: faBell },
        { href: "/dashboard/avvisi-citta", label: "Avvisi Città", icon: faCity },
        { href: "/dashboard/preferiti", label: "Preferiti / Top 10", icon: faHeart },
        { href: "/dashboard/forum", label: "Forum", icon: faComments },
        { href: "/autenticazione", label: "Esci", icon: faRightFromBracket },
      ];

  // Detect admin by role or email whitelist (temporary)
  const isAdmin = role === 'admin' || new Set(['musicamagazine23@gmail.com','admin@local']).has(email);

  // Append admin links if user is admin
  const adminItems = isAdmin
    ? [
        { href: "/dashboard/admin/crediti/ordini", label: "Admin · Ordini Crediti", icon: faBolt },
        { href: "/dashboard/admin/media/foto", label: "Admin · Moderazione Foto", icon: faIdCard },
        { href: "/dashboard/admin/media/video", label: "Admin · Moderazione Video", icon: faIdCard },
      ]
    : [];
  const items = [...baseItems, ...adminItems];

  return (
    <aside className="w-full md:w-64 bg-[#0f2a5c] text-white min-h-[calc(100vh-80px)] md:sticky md:top-[80px]">
      <div className="py-4 px-4 text-lg font-bold tracking-wide">Area Privata</div>
      <nav className="px-2 pb-6 space-y-1">
        {items.map((item: { href: string; label: string; icon: any }) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                active ? "bg-white text-[#0f2a5c] font-semibold" : "hover:bg-white/10"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} width={16} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <div className="mt-4 pt-3 border-t border-white/20 text-[11px] uppercase tracking-wide opacity-80 px-3">Admin</div>
        )}
      </nav>
      <div className="px-4 pb-4 text-xs opacity-80">Italiano</div>
    </aside>
  );
}
