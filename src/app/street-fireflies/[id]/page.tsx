"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/SectionHeader";

interface StreetEscortPhoto {
  id: number;
  url: string;
  isCensored: boolean;
}

interface StreetEscortDetail {
  id: number;
  name: string;
  city: string;
  shortDescription: string | null;
  fullDescription: string | null;
  price: number | null;
  photos: StreetEscortPhoto[];
}

export default function StreetFireflyDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<StreetEscortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMapAccess, setHasMapAccess] = useState(false);

  // Riusa la stessa logica di /escort/mappa per capire se l'utente ha un pacchetto attivo
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem("map-access");
      if (!raw) return;
      const data = JSON.parse(raw) as { code?: string; acquiredAt?: string } | null;
      if (!data?.code || !data?.acquiredAt) return;
      const acquired = new Date(data.acquiredAt).getTime();
      if (!Number.isFinite(acquired)) return;
      const now = Date.now();
      const days30 = 30 * 24 * 60 * 60 * 1000;
      if (now - acquired <= days30) {
        setHasMapAccess(true);
      }
    } catch {
      // ignora errori di parsing
    }
  }, []);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/public/street-fireflies?id=${encodeURIComponent(String(id))}`);
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(j?.error || "Profilo non trovato");
          setItem(null);
          return;
        }
        setItem(j.item as StreetEscortDetail);
      } catch (e) {
        console.error(e);
        setError("Errore durante il caricamento del profilo");
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  const censoredPhoto = item?.photos?.find((p) => p.isCensored) || item?.photos?.[0] || null;

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <SectionHeader
        title={item ? item.name : "Street Firefly"}
        subtitle={item?.city ? `Profilo speciale Street Fireflies · ${item.city}` : "Profilo speciale Street Fireflies"}
      />

      {loading && (
        <div className="text-sm text-gray-300">Caricamento profilo…</div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-400">{error}</div>
      )}

      {!loading && !error && item && (
        <div className="mt-4 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700 bg-gray-900 flex items-center justify-center">
                {censoredPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={censoredPhoto.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-gray-400 px-3 text-center">
                    Foto gestite dall'amministratore. Il volto può essere parzialmente censurato per privacy.
                  </div>
                )}
                {/* Maschera fissa: sfocatura e oscuramento leggero sulla metà superiore (volto), indipendentemente dal pacchetto */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-black/40 backdrop-blur-md" />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-white">{item.name}</h2>
                {item.city && (
                  <div className="text-sm text-gray-300">Zona: {item.city}</div>
                )}
              </div>
              {item.shortDescription && (
                <p className="text-sm text-gray-200">{item.shortDescription}</p>
              )}
              {item.price != null && (
                <div className="text-sm text-pink-400 font-semibold">
                  Prezzo indicativo: {item.price} (crediti o EUR, in base alla configurazione)
                </div>
              )}

              <div className="pt-2">
                {!hasMapAccess ? (
                  <>
                    <Button
                      onClick={() => {
                        // Reindirizza ai pacchetti per sbloccare i profili, riusando il sistema esistente
                        window.location.href = "/dashboard/pacchetti";
                      }}
                    >
                      Sblocca questo profilo con un pacchetto
                    </Button>
                    <p className="mt-2 text-xs text-gray-400">
                      Dopo aver acquistato un pacchetto valido potrai vedere tutte le informazioni disponibili
                      e lasciare recensioni secondo le regole del sito.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-green-400">
                    Profilo sbloccato grazie al tuo pacchetto attivo. Le foto rimangono censurate per privacy,
                    ma puoi consultare tutte le informazioni testuali e usare le funzionalità di recensione.
                  </p>
                )}
              </div>
            </div>
          </div>

          {item.fullDescription && (
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-200 whitespace-pre-line">
              {item.fullDescription}
            </div>
          )}

          {/* Placeholder sezione recensioni - integrazione API da fare in uno step successivo */}
          <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900 p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Recensioni</h3>
            <p className="text-xs text-gray-400 mb-3">
              Le recensioni per i profili Street Fireflies verranno gestite con lo stesso sistema di moderazione
              delle altre escort. La funzionalità di invio e visualizzazione verrà attivata in un passaggio successivo.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
