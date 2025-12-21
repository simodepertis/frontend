"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faVideo,
  faImages,
  faStar,
  faComments,
  faTrophy,
  faBullhorn,
  faLaptop,
  faPhone,
  faSearch,
  faUserCheck,
  faMapMarkerAlt,
  faCrown,
  faVenus,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [userName, setUserName] = useState<string>("");
  const [hasAptAds, setHasAptAds] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) return;
        
        const res = await fetch("/api/user/me", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          console.log('❌ Errore caricamento profilo utente');
          return;
        }
        
        const data = await res.json();
        setUserName(data?.user?.nome || "");
        console.log('✅ Nome utente caricato:', data?.user?.nome);

        // Verifica accesso Piccoli Annunci (B&B)
        try {
          const a = await fetch('/api/annunci/access', { headers: { 'Authorization': `Bearer ${token}` }});
          if (a.ok) { const j = await a.json(); setHasAptAds(!!j?.hasAccess); } else { setHasAptAds(false); }
        } catch { setHasAptAds(false); }
      } catch (error) {
        console.log('❌ Errore fetch profilo:', error);
        
        // Fallback: usa localStorage temporaneamente
        const email = localStorage.getItem('user-email');
        if (email) {
          setUserName(email.split('@')[0]);
        }
      }
    })();
  }, []);

  const handleLogout = async () => {
    console.log('🚪 Logout iniziato');
    try {
      // Chiama API logout
      await fetch("/api/logout", { method: "POST" });
      console.log('✅ API logout chiamata');
    } catch (error) {
      console.log('⚠️ Errore API logout:', error);
    }
    
    // Pulisci TUTTO il localStorage
    localStorage.clear();
    console.log('🧹 localStorage pulito');
    
    // Pulisci sessionStorage
    sessionStorage.clear();
    console.log('🧹 sessionStorage pulito');
    
    // Reset stato componente
    setUserName("");
    console.log('🔄 Stato componente resettato');
    
    // Reindirizza alla home
    router.push("/");
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-black text-white border-gray-800">
      {/* BARRA PRINCIPALE */}
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between gap-3 sm:gap-6">
        {/* SINISTRA: Logo */}
        <div className="flex items-center">
          <Logo className="w-[180px] sm:w-[220px] lg:w-[260px]" />
        </div>

        {/* DESTRA: Menu principale + azioni */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-6 text-sm">
          {/* Link principali (Nuove Escort, Tours, ecc.) - solo desktop */}
          <nav className="hidden md:flex items-center gap-4 font-medium">
            <Link href="/nuove-escort" className="hover:text-blue-400 transition-colors">Nuove Escort</Link>
            <Link href="/tours" className="hover:text-blue-400 transition-colors">Tours</Link>
            <Link href="/incontri-veloci" className="hover:text-blue-400 transition-colors">⚡ Incontri Veloci</Link>
            <Link href="/uomini" className="hover:text-blue-400 transition-colors">Gigolo</Link>
            <Link href="/instant-book" className="hover:text-blue-400 transition-colors">Instant Book</Link>
            <Link href="/agenzie" className="hover:text-blue-400 transition-colors">Agenzie</Link>
          </nav>

          {/* Contatti / Accedi / Cerca + hamburger */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/contatti" className="hidden md:flex items-center gap-2 hover:text-blue-400 transition-colors">
              <FontAwesomeIcon icon={faPhone} />
              <span>Contatti</span>
            </Link>
            {userName ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-full px-4 py-2 shrink-0">
                    <FontAwesomeIcon icon={faUser} />
                    <span>Ciao, {userName}</span>
                  </Button>
                </Link>
                <button onClick={handleLogout} className="underline text-gray-400 hover:text-blue-400">
                  Esci
                </button>
              </div>
            ) : (
              <Link href="/autenticazione">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base shrink-0">
                  <FontAwesomeIcon icon={faUser} />
                  <span>Accedi</span>
                </Button>
              </Link>
            )}
            <Link href="/cerca" className="hidden sm:inline-flex hover:text-blue-400 transition-colors">
              <FontAwesomeIcon icon={faSearch} size="lg" />
            </Link>
            <button
              type="button"
              className={`md:hidden inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black shrink-0 transition-all duration-200 ${
                mobileOpen
                  ? 'bg-gray-800 text-white'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-500/60 animate-pulse'
              }`}
              aria-label="Apri menu"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} />
            </button>
          </div>
        </div>

      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black/95">
          <div className="container py-3 flex flex-col gap-2 text-sm font-medium">
            <Link
              href="/nuove-escort"
              className="py-1.5 px-1 rounded hover:bg-gray-800 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Nuove Escort
            </Link>
            <Link
              href="/tours"
              className="py-1.5 px-1 rounded hover:bg-gray-800 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Tours
            </Link>
            <Link
              href="/incontri-veloci"
              className="py-1.5 px-1 rounded hover:bg-gray-800 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              ⚡ Incontri Veloci
            </Link>
            <Link
              href="/uomini"
              className="py-1.5 px-1 rounded hover:bg-gray-800 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Gigolo
            </Link>
            <Link
              href="/instant-book"
              className="py-1.5 px-1 rounded hover:bg-gray-800 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Instant Book
            </Link>
            <Link
              href="/agenzie"
              className="py-1.5 px-1 rounded hover:bg-gray-800 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Agenzie
            </Link>
            <div className="h-px w-full bg-gray-800 my-1" />
            <Link
              href="/contatti"
              className="py-1.5 px-1 rounded hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
              onClick={() => setMobileOpen(false)}
            >
              <FontAwesomeIcon icon={faPhone} />
              <span>Contatti</span>
            </Link>
            {!userName && (
              <Link
                href="/autenticazione"
                className="py-1.5 px-1 rounded hover:bg-gray-800 hover:text-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Accedi
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* BARRA SECONDARIA DELLE CATEGORIE */}
      <nav className="w-full bg-gray-900 border-y border-gray-700">
        <ul className="container flex flex-wrap justify-center gap-x-4 gap-y-2 py-2 text-sm font-medium text-gray-300">
          <li><Link href="/ricerca-citta" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faMapMarkerAlt} /> Ricerca Città</Link></li>
          <li><Link href="/escort-indipendenti" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faUserCheck} /> Escort Indipendenti</Link></li>
          <li><Link href="/sugardaddy" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faCrown} /> SugarDaddy</Link></li>
          <li><Link href="/trans" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faVenus} /> Trans</Link></li>
          <li><Link href="/video" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faVideo} /> Video</Link></li>
          <li><Link href="/foto" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faImages} /> Foto</Link></li>
          <li><Link href="/recensioni" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faStar} /> Recensioni</Link></li>
          <li><Link href="/commenti" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white transition-colors">Commenti</Link></li>
          <li><Link href="/top10" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faTrophy} /> Top 10</Link></li>
          {hasAptAds && (
            <li><Link href="/piccoli-annunci" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white transition-colors">Piccoli Annunci</Link></li>
          )}
          <li><Link href="/virtuali" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white transition-colors">Virtuali</Link></li>
          <li><Link href="/happy-hour" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white transition-colors">Happy Hour</Link></li>
          <li><Link href="/forum" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white transition-colors">Forum</Link></li>
          <li><Link href="/internazionale" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white transition-colors">Internazionale</Link></li>
          <li><Link href="/escort/mappa" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white transition-colors">Street Fireflies</Link></li>
        </ul>
      </nav>
    </header>
  );
}