"use client";

import MioProfiloSidebar from "@/components/MioProfiloSidebar";
import SectionHeader from "@/components/SectionHeader";

export default function CompilaProfiloLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4">
      <SectionHeader title="Compilazione Profilo" subtitle="Aggiorna le informazioni del tuo profilo" />
      <div className="flex gap-6 py-4">
        <div className="hidden md:block w-60 shrink-0">
          <MioProfiloSidebar />
        </div>
        <div className="md:hidden -mx-4">
          <MioProfiloSidebar />
        </div>
        <main className="flex-1 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
