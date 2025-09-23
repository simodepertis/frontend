"use client";

import MioProfiloSidebar from "@/components/MioProfiloSidebar";
import SectionHeader from "@/components/SectionHeader";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function CompilaProfiloLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  const { step, total, percent, label } = useMemo(() => {
    const order = [
      { key: "contatti", label: "Contatti" },
      { key: "biografia", label: "Biografia" },
      { key: "lingue", label: "Lingue" },
      { key: "citta-di-lavoro", label: "Città di Lavoro" },
      { key: "servizi", label: "Servizi" },
      { key: "orari", label: "Orari di Lavoro" },
      { key: "tariffe", label: "Tariffe" },
    ];
    const total = order.length;
    const found = order.findIndex(o => pathname.includes(`/dashboard/escort/compila/${o.key}`));
    const step = (found >= 0 ? found : 0) + 1;
    const percent = Math.round((step / total) * 100);
    const label = found >= 0 ? order[found].label : "";
    return { step, total, percent, label };
  }, [pathname]);

  return (
    <div className="container mx-auto px-4">
      <SectionHeader title="Compilazione Profilo" subtitle={`Step ${step}/${total} — ${label}`} />

      {/* Progress bar */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="font-semibold text-white">Completamento</div>
          <div className="text-gray-400">{percent}%</div>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-2 bg-blue-600" style={{ width: `${percent}%` }} />
        </div>
      </div>

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
