"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faVideo, faImages, faStar, faComments, faTrophy, faBullhorn, faLaptop, faPhone, faSearch
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // Temporaneamente disabilitato - aspettiamo deploy API
    // (async () => {
    //   try {
    //     const res = await fetch("/api/user/me");
    //     if (!res.ok) return;
    //     const data = await res.json();
    //     setUserName(data?.user?.nome || "");
    //   } catch {
    //     // ignore
    //   }
    // })();
    
    // Usa localStorage temporaneamente
    const email = localStorage.getItem('user-email');
    if (email) {
      setUserName(email.split('@')[0]);
    }
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
    window.location.href = "/";
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-black text-white border-gray-800">
      {/* BARRA PRINCIPALE */}
      <div className="container flex h-16 max-w-screen-2xl items-center">
        
        {/* COLONNA SINISTRA: Link di navigazione - MODIFICATO justify-end */}
        <div className="w-1/3 flex justify-end items-center gap-4 text-sm font-medium">
            <Link href="/escort" className="hover:text-blue-400 transition-colors">Nuove Escort</Link>
            <Link href="/foto" className="hover:text-blue-400 transition-colors">Foto</Link>
            <Link href="/video" className="hover:text-blue-400 transition-colors">Video</Link>
            <Link href="/agenzie" className="hover:text-blue-400 transition-colors">Agenzie</Link>
        </div>

        {/* COLONNA CENTRALE: Logo */}
        <div className="w-1/3 text-center">
            <Link href="/" className="text-2xl font-bold tracking-wider">
                INCONTRIESCORT.ORG
            </Link>
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
                    <span>Area Privata</span>
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
          <li><Link href="/video" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faVideo} /> Video</Link></li>
          <li><Link href="/foto" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faImages} /> Foto</Link></li>
          <li><Link href="/recensioni" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faStar} /> Recensioni</Link></li>
          <li><Link href="/commenti" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faComments} /> Commenti</Link></li>
          <li><Link href="/top10" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faTrophy} /> Top 10</Link></li>
          <li><Link href="/annunci" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faBullhorn} /> Annunci</Link></li>
          <li><Link href="/virtuali" className="px-3 py-1.5 rounded-md hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faLaptop} /> Virtuali</Link></li>
        </ul>
      </nav>
    </header>
  );
}