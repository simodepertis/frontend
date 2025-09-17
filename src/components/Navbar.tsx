"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faVideo, faImages, faStar, faComments, faTrophy, faBullhorn, faLaptop, faCocktail, faGlobe, faPhone, faSearch
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [user, setUser] = useState<null | { name: string }>(null);

  // La tua logica per il login rimane invariata
  useEffect(() => { 
    // Qui puoi inserire la logica per controllare se l'utente è loggato
  }, []);

  const handleLogout = () => { 
    // Qui puoi inserire la logica per il logout
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white text-black">
      {/* BARRA PRINCIPALE */}
      <div className="container flex h-16 max-w-screen-2xl items-center">
        
        {/* COLONNA SINISTRA: Link di navigazione - MODIFICATO justify-end */}
        <div className="w-1/3 flex justify-end items-center gap-4 text-sm font-medium">
            <Link href="/escort" className="hover:text-red-600 transition-colors">Nuove Escort</Link>
            <Link href="/escort" className="hover:text-red-600 transition-colors">Escorts Indipendenti</Link>
            <Link href="/citta/milano" className="hover:text-red-600 transition-colors">Tours</Link>
            <Link href="/agenzie" className="hover:text-red-600 transition-colors">Agenzie</Link>
        </div>

        {/* COLONNA CENTRALE: Logo */}
        <div className="w-1/3 text-center">
            <a href="/" className="text-2xl font-bold tracking-wider">
                INCONTRIESCORT.ORG
            </a>
        </div>

        {/* COLONNA DESTRA: Azioni e Contatti - MODIFICATO justify-start */}
        <div className="w-1/3 flex justify-start items-center gap-4 text-sm">
            <Link href="/contatti" className="flex items-center gap-2 hover:text-red-600 transition-colors">
                <FontAwesomeIcon icon={faPhone} />
                <span>Contatti</span>
            </Link>
            <Link href="/autenticazione">
                <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 rounded-full px-4 py-2">
                    <FontAwesomeIcon icon={faUser} />
                    <span>Accedi</span>
                </Button>
            </Link>
            <Link href="/cerca" className="hover:text-red-600 transition-colors">
                <FontAwesomeIcon icon={faSearch} size="lg" />
            </Link>
        </div>

      </div>
      
      {/* BARRA SECONDARIA DELLE CATEGORIE */}
      <nav className="w-full bg-neutral-100 border-y">
        <ul className="container flex flex-wrap justify-center gap-x-4 gap-y-2 py-2 text-sm font-medium text-neutral-600">
          <li><a href="/video" className="px-3 py-1.5 rounded-md hover:bg-neutral-200 flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faVideo} /> Video</a></li>
          <li><a href="/foto" className="px-3 py-1.5 rounded-md hover:bg-neutral-200 flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faImages} /> Foto</a></li>
          <li><a href="/recensioni" className="px-3 py-1.5 rounded-md hover:bg-neutral-200 flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faStar} /> Recensioni</a></li>
          <li><a href="/commenti" className="px-3 py-1.5 rounded-md hover:bg-neutral-200 flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faComments} /> Commenti</a></li>
          <li><a href="/top10" className="px-3 py-1.5 rounded-md hover:bg-neutral-200 flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faTrophy} /> Top 10</a></li>
          <li><a href="/annunci" className="px-3 py-1.5 rounded-md hover:bg-neutral-200 flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faBullhorn} /> Annunci</a></li>
          <li><a href="/virtuali" className="px-3 py-1.5 rounded-md hover:bg-neutral-200 flex items-center gap-2 transition-colors"><FontAwesomeIcon icon={faLaptop} /> Virtuali</a></li>
        </ul>
      </nav>
    </header>
  );
}