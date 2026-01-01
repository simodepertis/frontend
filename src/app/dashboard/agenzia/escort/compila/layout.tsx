"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SectionHeader from "@/components/SectionHeader";
import { Suspense } from "react";

function AgencyEscortCompilaSidebar({ escortUserId }: { escortUserId: number }) {
  const pathname = usePathname() || "";
  const q = escortUserId ? `?escortUserId=${encodeURIComponent(String(escortUserId))}` : "";

  const voci = [
    { href: `/dashboard/agenzia/escort/compila${q}`, label: "Hub" },
    { href: `/dashboard/agenzia/escort/compila/biografia${q}`, label: "Biografia" },
    { href: `/dashboard/agenzia/escort/compila/contatti${q}`, label: "Contatti" },
    { href: `/dashboard/agenzia/escort/compila/lingue${q}`, label: "Lingue" },
    { href: `/dashboard/agenzia/escort/compila/citta-di-lavoro${q}`, label: "Città di lavoro" },
    { href: `/dashboard/agenzia/escort/compila/servizi${q}`, label: "Servizi" },
    { href: `/dashboard/agenzia/escort/compila/orari${q}`, label: "Orari" },
    { href: `/dashboard/agenzia/escort/compila/tariffe${q}`, label: "Tariffe" },
    { href: `/dashboard/agenzia/escort/compila/galleria-foto${q}`, label: "Galleria foto" },
    { href: `/dashboard/agenzia/escort/compila/video${q}`, label: "Video" },
    { href: `/dashboard/agenzia/escort/compila/documenti${q}`, label: "Documenti" },
  ];

  return (
    <aside className="w-full md:w-60 bg-[#0f2a5c] text-white rounded-lg">
      <div className="px-4 py-3 font-bold">Compila Escort</div>
      <div className="px-4 pb-2 text-xs text-white/70">{escortUserId ? `User #${escortUserId}` : 'Seleziona una escort'}</div>
      <nav className="px-2 pb-4 space-y-1">
        {voci.map((v) => {
          const active = pathname?.startsWith(v.href.split('?')[0]);
          return (
            <Link
              key={v.href}
              href={v.href}
              className={`block px-3 py-2 rounded-md ${active ? 'bg-white text-[#0f2a5c] font-semibold' : 'hover:bg-white/10'}`}
            >
              {v.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const escortUserId = Number(params?.get('escortUserId') || 0);

  return (
    <div className="container mx-auto px-4">
      <SectionHeader title="Compila Profilo Escort" subtitle={escortUserId ? `User #${escortUserId}` : "Seleziona una escort"} />
      <div className="flex gap-6 py-4">
        <div className="hidden md:block w-60 shrink-0">
          <AgencyEscortCompilaSidebar escortUserId={escortUserId} />
        </div>
        <div className="md:hidden -mx-4">
          <AgencyEscortCompilaSidebar escortUserId={escortUserId} />
        </div>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}

export default function AgencyEscortCompilaLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Caricamento...</div>}>
      <InnerLayout>{children}</InnerLayout>
    </Suspense>
  );
}
