"use client";

import { useEffect, useMemo, useState } from "react";
import { CITIES_ORDER } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import EscortCard from "@/components/EscortCard";
import FilterBar from "@/components/FilterBar";
import SeoHead from "@/components/SeoHead";

const cittaOptions = CITIES_ORDER;
const capelliOptions = ["Biondi", "Castani", "Neri"];

export default function EscortListPage() {
  const [filtroCitta, setFiltroCitta] = useState("");
  const [filtroCapelli, setFiltroCapelli] = useState("");
  const [country, setCountry] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize from URL params (?country=XX&citta=YYY)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const c = sp.get('citta') || "";
      const co = sp.get('country') || "";
      if (c) setFiltroCitta(c);
      if (co) setCountry(co);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filtroCitta) params.set('citta', filtroCitta);
        if (country) params.set('country', country);
        const res = await fetch(`/api/public/annunci?${params.toString()}`);
        if (res.ok) {
          const j = await res.json();
          setItems(j.items || []);
        } else {
          setItems([]);
        }
      } finally { setLoading(false); }
    })();
  }, [filtroCitta, country]);

  const escortsFiltrate = useMemo(() => {
    // capelli filtro non ancora supportato su API: applico client-side
    return items.filter((e:any) => !filtroCapelli || true);
  }, [items, filtroCapelli]);

  return (
    <>
      <SeoHead
        title="Escort | Incontriescort.org"
        description="Lista escort con filtri per città e nazione. Trova profili e annunci aggiornati."
        canonicalPath="/escort"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Escort",
          url: (process.env.NEXT_PUBLIC_SITE_URL || "https://incontriescort.org") + "/escort",
        }}
      />
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Escort</h1>

      {/* Filtro stile home con FilterBar */}
      <FilterBar title="Trova la tua compagnia ideale" actions={
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-2 h-auto rounded-md">
          <FontAwesomeIcon icon={faSearch} className="mr-2"/>
          Cerca
        </Button>
      }>
        <div className="flex flex-col gap-1">
          <label htmlFor="citta" className="text-sm font-medium text-white">Città</label>
          <select
            id="citta"
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtroCitta}
            onChange={(e) => setFiltroCitta(e.target.value)}
          >
            <option value="">Tutte le città</option>
            {cittaOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="capelli" className="text-sm font-medium text-white">Colore Capelli</label>
          <select
            id="capelli"
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtroCapelli}
            onChange={(e) => setFiltroCapelli(e.target.value)}
          >
            <option value="">Tutti i capelli</option>
            {capelliOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </FilterBar>

      {/* Griglia risultati */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 flex-grow">
        {loading && (
          <div className="col-span-full text-center text-gray-400 py-10">Caricamento…</div>
        )}
        {!loading && escortsFiltrate.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-10">
            Nessun risultato trovato. Prova a modificare i filtri.
          </div>
        )}
        {escortsFiltrate.map((e:any) => (
          <EscortCard key={e.id} escort={{ id: e.id, nome: e.name, eta: Number(e.eta) || 0, citta: Array.isArray(e.cities)&&e.cities[0]?String(e.cities[0]):'—', capelli: '', prezzo: e.price || 0, foto: e.coverUrl || '/placeholder.svg', rank: e.tier, isVerified: !!e.hasApprovedDoc }} />
        ))}
      </div>
    </main>
    </>
  );
}

