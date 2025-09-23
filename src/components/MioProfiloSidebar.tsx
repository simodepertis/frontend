"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const voci = [
  { href: "/dashboard/mio-profilo/contatti", label: "Contatti" },
  { href: "/dashboard/mio-profilo/biografia", label: "Biografia" },
  { href: "/dashboard/mio-profilo/lingue", label: "Lingue" },
  { href: "/dashboard/mio-profilo/citta-di-lavoro", label: "Città di Lavoro" },
  { href: "/dashboard/mio-profilo/servizi", label: "Servizi" },
  { href: "/dashboard/mio-profilo/orari", label: "Orari di Lavoro" },
  { href: "/dashboard/mio-profilo/tariffe", label: "Tariffe" },
  { href: "/dashboard/mio-profilo/foto-naturale", label: "Foto Naturale" },
];

export default function MioProfiloSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-full md:w-60 bg-[#0f2a5c] text-white rounded-lg">
      <div className="px-4 py-3 font-bold">Il Mio Profilo</div>
      <nav className="px-2 pb-4 space-y-1">
        {voci.map((v) => {
          const active = pathname?.startsWith(v.href);
          return (
            <Link key={v.href} href={v.href} className={`block px-3 py-2 rounded-md ${active ? 'bg-white text-[#0f2a5c] font-semibold' : 'hover:bg-white/10'}`}>
              {v.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
