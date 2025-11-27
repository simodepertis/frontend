"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES_CITIES } from "@/lib/internationalCities";

// Pagina mappa pubblica escort: per ora solo mappa + selettori paese/città
// In uno step successivo aggiungeremo i marker reali e il paywall sul click della card

export default function EscortMapPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [center, setCenter] = useState<{ lat: number; lon: number }>({ lat: 45.4642, lon: 9.19 }); // Milano default
  const [escorts, setEscorts] = useState<Array<{ id: number; slug: string; name: string; lat: number | null; lon: number | null; category: string; coverUrl: string | null }>>([]);
  const markersRef = useRef<any[]>([]);
  const [leafletReady, setLeafletReady] = useState(false);

  const availableCities = selectedCountry ? COUNTRIES_CITIES[selectedCountry]?.cities || [] : [];

  const handleSearch = async () => {
    if (!selectedCountry || !selectedCity) {
      alert("Seleziona sia il paese che la città");
      return;
    }

    try {
      // Usa Nominatim per trovare le coordinate della città selezionata
      const countryName = COUNTRIES_CITIES[selectedCountry]?.name || selectedCountry;
      const q = encodeURIComponent(`${selectedCity}, ${countryName}`);
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
        { headers: { "Accept-Language": "it" } }
      );
      if (!resp.ok) return;
      const arr = await resp.json();
      const lat = arr?.[0]?.lat ? parseFloat(arr[0].lat) : null;
      const lon = arr?.[0]?.lon ? parseFloat(arr[0].lon) : null;
      if (lat === null || lon === null) return;

      setCenter({ lat, lon });

      // Se la mappa è già creata, centra subito senza ricrearla
      try {
        if (mapRef.current && typeof mapRef.current.setView === "function") {
          mapRef.current.setView([lat, lon], 12);
        }
      } catch {
        // ignora errori di setView
      }

      // Carica le escort con posizione per la città selezionata
      try {
        const qs = new URLSearchParams({ country: selectedCountry, citta: selectedCity }).toString();
        const r = await fetch(`/api/public/annunci?${qs}`);
        if (r.ok) {
          const j = await r.json();
          const items = Array.isArray(j.items) ? j.items : [];
          // mappiamo solo le escort che hanno una posizione precisa
          const mapped = items.map((it: any) => {
            const latNum = it.positionLat !== undefined && it.positionLat !== null ? Number(it.positionLat) : NaN;
            const lonNum = it.positionLon !== undefined && it.positionLon !== null ? Number(it.positionLon) : NaN;
            return {
              id: it.id,
              slug: it.slug,
              name: it.name,
              lat: Number.isFinite(latNum) ? latNum : null,
              lon: Number.isFinite(lonNum) ? lonNum : null,
              category: it.mapCategory || 'ESCORT',
              coverUrl: it.coverUrl || null,
            };
          });
          setEscorts(mapped);
        } else {
          setEscorts([]);
        }
      } catch {
        setEscorts([]);
      }
    } catch {
      // ignora errori di rete/geocoding
    }
  };

  // Carica Leaflet via CDN come nella pagina dettaglio escort
  function loadLeafletFromCDN(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("SSR"));
      const w: any = window as any;
      if (w.L) return resolve(w.L);
      const cssId = "leaflet-css";
      if (!document.getElementById(cssId)) {
        const link = document.createElement("link");
        link.id = cssId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      const jsId = "leaflet-js";
      if (!document.getElementById(jsId)) {
        const s = document.createElement("script");
        s.id = jsId;
        s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        s.async = true;
        s.onload = () => {
          try {
            const L = (window as any).L;
            L.Icon.Default.mergeOptions({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
            resolve(L);
          } catch (e) {
            reject(e);
          }
        };
        s.onerror = () => reject(new Error("Leaflet load failed"));
        document.body.appendChild(s);
      } else {
        const iv = setInterval(() => {
          if ((window as any).L) {
            clearInterval(iv);
            resolve((window as any).L);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(iv);
          reject(new Error("Leaflet not available"));
        }, 5000);
      }
    });
  }

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        if (!mapDivRef.current) return;
        const L = await loadLeafletFromCDN().catch(() => null);
        if (!L) return;

        // Se la mappa esiste già, limita l'effetto a un semplice setView quando cambia il centro
        if (mapRef.current) {
          try {
            mapRef.current.setView([center.lat, center.lon], 12);
          } catch {}
          return;
        }

        let lat = center.lat;
        let lon = center.lon;

        if (canceled) return;
        mapRef.current = L.map(mapDivRef.current, {
          zoomControl: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
        }).setView([lat, lon], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);

        setLeafletReady(true);
      } catch {
        // ignora errori iniziali
      }
    })();
    return () => {
      canceled = true;
    };
  }, [center]);

  // Aggiorna i marker quando cambia l'elenco escort e la mappa è pronta
  useEffect(() => {
    try {
      if (!mapRef.current || typeof window === "undefined" || !leafletReady) return;
      const L = (window as any).L;
      if (!L) return;

      // Rimuovi marker precedenti
      markersRef.current.forEach((m) => {
        try {
          mapRef.current.removeLayer(m);
        } catch {}
      });
      markersRef.current = [];

      const coords: [number, number][] = [];

      const getIconForCategory = (category: string) => {
        let bg = '#ec4899'; // escort: rosa
        let symbol = '&#9792;'; // ♀
        if (category === 'TRANS') {
          bg = '#22c55e'; // verde
          symbol = '&#9895;'; // ⚧
        } else if (category === 'COPPIE') {
          bg = '#6366f1'; // blu
          symbol = '&#9903;'; // generic symbol
        }

        return L.divIcon({
          className: 'escort-map-marker',
          html: `
            <div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${bg};color:white;font-size:16px;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);">
              <span style="line-height:1;">${symbol}</span>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
        });
      };

      escorts
        .filter((e) => typeof e.lat === "number" && typeof e.lon === "number")
        .forEach((e) => {
          const lat = e.lat as number;
          const lon = e.lon as number;
          const icon = getIconForCategory(String(e.category || 'ESCORT'));
          const marker = L.marker([lat, lon], { icon });
          if (e.name) {
            marker.bindPopup(e.name);
          }
          marker.addTo(mapRef.current);
          markersRef.current.push(marker);
          coords.push([lat, lon]);
        });

      // centra la mappa sui marker se ne abbiamo almeno uno
      if (coords.length > 0) {
        try {
          const bounds = L.latLngBounds(coords.map(([la, lo]) => L.latLng(la, lo)));
          mapRef.current.fitBounds(bounds, { padding: [40, 40] });
        } catch {}
      }
    } catch {
      // ignora errori sui marker
    }
  }, [escorts, leafletReady]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white">Mappa Escort</h1>
        <p className="text-gray-300">Visualizza su mappa le escort per Paese e città.</p>
      </div>

      {/* SELETTORI PAESE E CITTÀ - stesso stile di /internazionale */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">🌍 Cerca per Città</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Selezione Paese */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Seleziona Paese *</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedCity("");
              }}
            >
              <option value="">-- Seleziona un paese --</option>
              {Object.entries(COUNTRIES_CITIES).map(([code, data]) => (
                <option key={code} value={code}>
                  {data.name} ({data.cities.length} città)
                </option>
              ))}
            </select>
          </div>

          {/* Selezione Città */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Seleziona Città *</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedCountry}
            >
              <option value="">
                {selectedCountry ? "-- Seleziona una città --" : "Prima seleziona un paese"}
              </option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottone Cerca (per ora solo aggiorna stato interno) */}
        <button
          onClick={handleSearch}
          disabled={!selectedCountry || !selectedCity}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          🔍 Cerca Escort sulla mappa
        </button>
        <p className="mt-2 text-sm text-gray-300">
          {escorts.length > 0
            ? `Escort con posizione trovate: ${escorts.length}`
            : "Nessuna escort con posizione trovata per la ricerca corrente"}
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden" style={{ minHeight: "520px" }}>
        <div ref={mapDivRef} className="w-full h-[520px]" />
      </div>
    </main>
  );
}
