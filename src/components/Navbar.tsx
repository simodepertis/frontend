"use client";

import Link from "next/link";
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
  faCocktail,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [user, setUser] = useState<null | { name: string; credits?: number }>(null);

  useEffect(() => {
    const jwt =
      typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (jwt) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/user/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.name) setUser(data);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setUser(null);
    window.location.reload();
  };

  return (
    <>
      <nav
        className="w-full flex  justify-between py-4 px-6 min-h-0 h-[57px]"
        style={{
          backgroundColor: "#0738b5",
          borderBottom: "2px solid #052a87",
        }}
      >
        <div className="flex-1 flex justify-center">
          <a
            href="/"
            className="text-xl font-bold tracking-tight text-white mx-8 hover:underline focus:outline-none"
          >
            Incontriescort.org
          </a>
        </div>
        <div className="flex-1 flex justify-center pr-8 items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-transparent border-white shadow-none text-white hover:text-[#f3d074] hover:border-[#f3d074] flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-lg" />
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => (window.location.href = "/profile")}>Profilo</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">Esci</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/autenticazione">
              <Button
                variant="ghost"
                className="border border-white bg-transparent text-white hover:bg-white/10 hover:text-[#f3d074] hover:border-[#f3d074] flex items-center gap-2 shadow-none"
                style={{ borderColor: "#fff" }}
              >
                <FontAwesomeIcon icon={faUser} className="text-lg" />
                Accedi
              </Button>
            </Link>
          )}
        </div>
      </nav>
      <nav className="w-full bg-neutral-100 border-b border-neutral-200">
        <ul className="flex flex-wrap justify-center gap-2 py-2 text-[15px] font-medium text-neutral-700">
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faVideo} />
              Video
            </a>
          </li>
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faImages} />
              Foto
            </a>
          </li>
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faStar} />
              Recensioni
            </a>
          </li>
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faComments} />
              Commenti
            </a>
          </li>
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faTrophy} />
              Top 10
            </a>
          </li>
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faBullhorn} />
              Piccoli Annunci
            </a>
          </li>
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faLaptop} />
              Servizi Virtuali
            </a>
          </li>
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCocktail} />
              Happy Hour
            </a>
          </li>
          <li>
            <a
              href="#"
              className="px-3 py-1 rounded hover:bg-neutral-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faGlobe} />
              Internazionale
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
