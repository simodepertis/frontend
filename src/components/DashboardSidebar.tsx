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
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
        const res = await fetch("/api/user/me", {
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });
        
        if (res.ok) {
          const data = await res.json();
          const rawRole = (data?.user?.ruolo || "").toLowerCase();
          const map: Record<string,string> = { agenzia: 'agency' };
          const norm = map[rawRole] || rawRole;
          setRole(norm);
          setEmail(data?.user?.email || "");
          console.log('✅ Sidebar - Ruolo utente:', data?.user?.ruolo);
        } else {
          console.log('❌ Errore caricamento profilo sidebar');
        }
      } catch (error) {
        console.log('❌ Errore fetch sidebar:', error);
      }
    })();
  }, []);

  const baseItems = role === "escort"
    ? [
        { href: "/dashboard/escort", label: "Dashboard Escort", icon: faGaugeHigh },
        { href: "/dashboard/impostazioni", label: "Il Mio Profilo", icon: faUser },
        { href: "/dashboard/escort/compila", label: "Profilo Escort", icon: faIdCard },
        { href: "/dashboard/incontri-veloci", label: "Incontri Veloci", icon: faBolt },
        { href: "/dashboard/verifica-foto", label: "Verifica Foto al 100%", icon: faCircleCheck },
        { href: "/dashboard/verifica-video", label: "Verifica Video", icon: faVideo },
        { href: "/dashboard/prenotazioni", label: "Prenotazioni Istantanee", icon: faBolt },
        // { href: "/dashboard/annunci/nuovo", label: "Nuovo Annuncio", icon: faBullhorn }, // rimosso per escort
        { href: "/dashboard/lui-cerca", label: "Lui Cerca", icon: faMagnifyingGlass },
        { href: "/dashboard/tour-citta", label: "Tour Città", icon: faPlane },
        { href: "/dashboard/pubblicita", label: "Acquista Pubblicità", icon: faBullhorn },
        { href: "/dashboard/annunci", label: "Piccoli Annunci (B&B)", icon: faBullhorn },
        { href: "/dashboard/ragazza-del-giorno", label: "Ragazza Del Giorno", icon: faWandMagicSparkles },
        { href: "/dashboard/bump-profilo", label: "Bump Profilo", icon: faArrowUp },
        { href: "/dashboard/recensioni", label: "Recensioni", icon: faStar },
        // impostazioni duplicato rimosso (usa 'Il Mio Profilo')
        { href: "/dashboard/supporto", label: "Supporto", icon: faLifeRing },
        { href: "/dashboard/statistiche", label: "Statistiche del Profilo", icon: faChartBar },
        { href: "/dashboard/crediti", label: "Crediti", icon: faBolt },
        { href: "/dashboard/lista-nera", label: "Lista Nera Clienti", icon: faBan },
        { href: "/dashboard/carrello", label: "Carrello", icon: faCartShopping },
        { href: "/dashboard/avvisi", label: "Avvisi", icon: faBell },
        // { href: "/dashboard/preferiti", label: "Preferiti / Top 10", icon: faHeart }, // rimosso per escort
        { href: "/dashboard/forum", label: "Forum", icon: faComments },
        { href: "/", label: "Vai all'Area Pubblica", icon: faGlobe },
        { href: "/autenticazione", label: "Esci", icon: faRightFromBracket },
      ]
    : role === "agency"
    ? [
        { href: "/dashboard/agenzia", label: "Dashboard Agenzia", icon: faGaugeHigh },
        { href: "/dashboard/impostazioni", label: "Il Mio Profilo", icon: faUser },
        { href: "/dashboard/agenzia/compila", label: "Profilo Agenzia", icon: faIdCard },
        { href: "/dashboard/agenzia/escort", label: "Gestione Escort", icon: faUser },
        { href: "/dashboard/agenzia/incontri-veloci", label: "Incontri Veloci", icon: faBolt },
        { href: "/dashboard/verifica-foto", label: "Verifica Foto al 100%", icon: faCircleCheck },
        { href: "/dashboard/verifica-video", label: "Verifica Video", icon: faVideo },
        { href: "/dashboard/certificazione-eta", label: "Certificazione dell'Età", icon: faIdCard },
        { href: "/dashboard/storie", label: "Storie", icon: faComments },
        { href: "/dashboard/happy-hour", label: "Happy Hour", icon: faBolt },
        { href: "/dashboard/prenotazioni", label: "Prenotazioni Istantanee", icon: faBolt },
        // { href: "/dashboard/annunci/nuovo", label: "Nuovo Annuncio", icon: faBullhorn }, // rimosso per agenzia
        { href: "/dashboard/lui-cerca", label: "Lui Cerca", icon: faMagnifyingGlass },
        { href: "/dashboard/tour-citta", label: "Tour Città", icon: faPlane },
        { href: "/dashboard/pubblicita", label: "Acquista Pubblicità", icon: faBullhorn },
        { href: "/dashboard/ragazza-del-giorno", label: "Ragazza Del Giorno", icon: faWandMagicSparkles },
        { href: "/dashboard/bump-profilo", label: "Bump Profilo", icon: faArrowUp },
        { href: "/dashboard/recensioni", label: "Recensioni", icon: faStar },
        { href: "/dashboard/supporto", label: "Supporto", icon: faLifeRing },
        { href: "/dashboard/statistiche", label: "Statistiche", icon: faChartBar },
        { href: "/dashboard/crediti", label: "Crediti", icon: faBolt },
        { href: "/dashboard/avvisi", label: "Avvisi", icon: faBell },
        // { href: "/dashboard/preferiti", label: "Preferiti / Top 10", icon: faHeart }, // rimosso per agenzia
        { href: "/dashboard/carrello", label: "Carrello", icon: faCartShopping },
        { href: "/dashboard/forum", label: "Forum", icon: faComments },
        { href: "/", label: "Vai all'Area Pubblica", icon: faGlobe },
        { href: "/autenticazione", label: "Esci", icon: faRightFromBracket },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: faGaugeHigh },
        { href: "/dashboard/ricerca", label: "La Ricerca", icon: faMagnifyingGlass },
        { href: "/dashboard/avvisi", label: "Avvisi", icon: faBell },
        { href: "/dashboard/avvisi-citta", label: "Avvisi Città", icon: faCity },
        { href: "/dashboard/street-fireflies", label: "Street Fireflies", icon: faGlobe },
        { href: "/dashboard/preferiti", label: "Preferiti / Top 10", icon: faHeart },
        { href: "/dashboard/forum", label: "Forum", icon: faComments },
        { href: "/dashboard/supporto", label: "Supporto", icon: faLifeRing },
        { href: "/dashboard/crediti", label: "Acquista crediti", icon: faBolt },
        { href: "/dashboard/pacchetti", label: "Acquista pacchetti", icon: faCartShopping },
        { href: "/autenticazione", label: "Esci", icon: faRightFromBracket },
      ];

  // Detect admin by role only - NO email whitelist for security
  const isAdmin = role === 'admin';
  console.log('🔒 Controllo admin:', { role, email, isAdmin });

  // Admin has ONLY admin functions - no regular user functions
  const adminOnlyItems = isAdmin
    ? [
      { href: "/dashboard/admin", label: "🏠 Dashboard Admin", icon: faGaugeHigh },
      { href: "/dashboard/admin/import-bakeca", label: "🤖 Import Bakecaincontri", icon: faBolt },
      { href: "/dashboard/admin/annunci", label: "📝 Moderazione Annunci", icon: faBullhorn },
      { href: "/dashboard/admin/crediti/ordini", label: "💳 approvazione Ordini Crediti", icon: faBolt },
      { href: "/dashboard/admin/media/foto", label: "📸 Moderazione Foto", icon: faIdCard },
      { href: "/dashboard/admin/media/video", label: "🎥 Moderazione Video", icon: faVideo },
      { href: "/dashboard/admin/documenti", label: "📄 Moderazione Documenti", icon: faIdCard },
      { href: "/dashboard/admin/commenti", label: "💬 Moderazione Commenti", icon: faComments },
      { href: "/dashboard/admin/recensioni", label: "⭐ Approva Recensioni", icon: faStar },
      { href: "/dashboard/admin/incontri-veloci/recensioni", label: "⭐ Recensioni Incontri Veloci", icon: faStar },
      { href: "/dashboard/admin/profili", label: "👤 approvazione Profili", icon: faUser },
      { href: "/dashboard/admin/utenti", label: "👥 Gestione Utenti", icon: faGear },
      { href: "/dashboard/admin/contatti", label: "📇 Gestione Contatti", icon: faGear },
      { href: "/dashboard/admin/incontri-veloci/pacchetti", label: "⚡ Pacchetti Incontri Veloci", icon: faBolt },
      { href: "/dashboard/admin/crediti/catalogo", label: "🛍️ Catalogo Crediti", icon: faCartShopping },
      { href: "/dashboard/admin/crediti/impostazioni", label: "⚙️ Impostazioni Crediti", icon: faGear },
      { href: "/dashboard/admin/street-fireflies", label: "🌃 Street Fireflies", icon: faGlobe },
      { href: "/dashboard/admin/street-fireflies-richieste", label: "✅ Richieste Street Fireflies", icon: faGlobe },
      { href: "/dashboard/admin/statistiche", label: "📊 Statistiche Sito", icon: faChartBar },
      { href: "/", label: "🌐 Vai al Sito", icon: faGlobe },
      { href: "/autenticazione", label: "🚺 Esci", icon: faRightFromBracket },
    ]
    : [];

  // Regular users get normal items, admin gets ONLY admin items
  const items = isAdmin ? adminOnlyItems : baseItems;

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
