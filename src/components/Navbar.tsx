"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faVideo, faImages, faStar, faComments, faTrophy, faBullhorn, faLaptop, faPhone, faSearch, faUserCheck, faMapMarkerAlt, faCrown, faVenus
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [userName, setUserName] = useState<string>("");
  const [hasAptAds, setHasAptAds] = useState(false);
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
      <div className="container flex h-16 max-w-screen-2xl items-center">
        
        {/* COLONNA SINISTRA: Link di navigazione - MODIFICATO justify-end */}
        <div className="w-1/3 flex justify-end items-center gap-4 text-sm font-medium">
            <Link href="/nuove-escort" className="hover:text-blue-400 transition-colors">Nuove Escort</Link>
            <Link href="/tours" className="hover:text-blue-400 transition-colors">Tours</Link>
            <Link href="/uomini" className="hover:text-blue-400 transition-colors">Gigolo</Link>
            <Link href="/instant-book" className="hover:text-blue-400 transition-colors">Instant Book</Link>
            <Link href="/agenzie" className="hover:text-blue-400 transition-colors">Agenzie</Link>
        </div>

        {/* COLONNA CENTRALE: Logo */}
        <div className="w-1/3 flex justify-center">
            <Logo className="w-[260px]" />
        </div>

        {/* COLONNA DESTRA: Azioni e Contatti - MODIFICATO justify-start */}
        <div className="w-1/3 flex justify-start items-center gap-4 text-sm">
            <Link href="/contatti" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <FontAwesomeIcon icon={faPhone} />
                <span>Contatti</span>
            </Link>
            {userName ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-full px-4 py-2">
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
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-full px-4 py-2">
                  <FontAwesomeIcon icon={faUser} />
                  <span>Accedi</span>
                </Button>
              </Link>
            )}
            <Link href="/cerca" className="hover:text-blue-400 transition-colors">
                <FontAwesomeIcon icon={faSearch} size="lg" />
            </Link>
        </div>

      </div>
      
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
        </ul>
      </nav>
    </header>
  );
}