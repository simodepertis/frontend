"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faShieldHalved, faStar, faGem } from "@fortawesome/free-solid-svg-icons";

export default function CatalogoCreditiPubblicoPage() {
  type Product = { code: string; label: string; creditsCost: number; durationDays: number };
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/credits/catalog');
        if (res.ok) {
          const { products } = await res.json();
          setList(products || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function iconFor(code: string) {
    if (code.startsWith('VIP')) return faCrown;
    if (code.startsWith('TITANIO')) return faShieldHalved;
    if (code.startsWith('ORO')) return faStar;
    if (code.startsWith('ARGENTO')) return faGem;
    return faStar;
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <SectionHeader title="Catalogo Crediti" subtitle="Scegli il posizionamento ideale e acquista i crediti dalla tua dashboard" />

      <div className="rounded-xl border bg-white p-5">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-lg border bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessun prodotto disponibile al momento.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map(p => (
              <div key={p.code} className="rounded-lg border p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 grid place-items-center rounded-full bg-red-100 text-red-700">
                    <FontAwesomeIcon icon={iconFor(p.code)} />
                  </div>
                  <div className="font-semibold text-neutral-800">{p.label}</div>
                </div>
                <div className="text-sm text-neutral-600">Costo: {p.creditsCost} crediti</div>
                <div className="text-sm text-neutral-600">Durata: {p.durationDays} giorni</div>
                <div className="pt-1">
                  <a href="/dashboard/crediti"><Button className="w-full">Acquista dalla Dashboard</Button></a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
