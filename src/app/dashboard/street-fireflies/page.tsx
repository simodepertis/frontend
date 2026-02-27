"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { COUNTRIES_CITIES, COUNTRY_LIST } from "@/lib/internationalCities";

type Submission = {
  id: number;
  name: string;
  city: string;
  lat: number;
  lon: number;
  category: string;
  shortDescription: string | null;
  fullDescription: string | null;
  price: number | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

export default function UserStreetFirefliesSubmitPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Submission[]>([]);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [category, setCategory] = useState<string>("ESCORT");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [photoBase64, setPhotoBase64] = useState<string>("");

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [center, setCenter] = useState<{ lat: number; lon: number }>({ lat: 45.4642, lon: 9.19 });
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const availableCities = selectedCountry ? COUNTRIES_CITIES[selectedCountry]?.cities || [] : [];

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
            const L = (window as any).L;
            L.Icon.Default.mergeOptions({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
            resolve(L);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(iv);
          reject(new Error("Leaflet not available"));
        }, 5000);
      }
    });
  }

  function updateLatLon(pos: { lat: number; lon: number }) {
    setLat(String(pos.lat));
    setLon(String(pos.lon));
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const res = await fetch("/api/street-fireflies/submissions", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error || "Errore caricamento richieste");
        setItems([]);
        return;
      }
      setItems(j.items || []);
    } catch (e) {
      console.error(e);
      setError("Errore imprevisto durante il caricamento");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    (async () => {
      const L = await loadLeafletFromCDN().catch(() => null);
      if (!L || !mapDivRef.current) return;
      const map = L.map(mapDivRef.current).setView([center.lat, center.lon], 12);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const marker = L.marker([center.lat, center.lon], { draggable: true }).addTo(map);
      markerRef.current = marker;
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        updateLatLon({ lat: p.lat, lon: p.lng });
        setCenter({ lat: p.lat, lon: p.lng });
      });
      map.on("click", (e: any) => {
        const p = e.latlng;
        marker.setLatLng(p);
        updateLatLon({ lat: p.lat, lon: p.lng });
        setCenter({ lat: p.lat, lon: p.lng });
      });
      setLeafletReady(true);
      updateLatLon(center);
    })();
  }, [center.lat, center.lon]);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || !markerRef.current) return;
    try {
      markerRef.current.setLatLng([center.lat, center.lon]);
      mapRef.current.setView([center.lat, center.lon]);
    } catch {}
  }, [center, leafletReady]);

  useEffect(() => {
    (async () => {
      try {
        if (!selectedCountry || !selectedCity) return;
        const countryName = COUNTRIES_CITIES[selectedCountry]?.name || selectedCountry;
        const q = encodeURIComponent(`${selectedCity}, ${countryName}`);
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, {
          headers: { "Accept-Language": "it" },
        });
        if (!resp.ok) return;
        const arr = await resp.json();
        const latN = arr?.[0]?.lat ? parseFloat(arr[0].lat) : null;
        const lonN = arr?.[0]?.lon ? parseFloat(arr[0].lon) : null;
        if (latN == null || lonN == null || !Number.isFinite(latN) || !Number.isFinite(lonN)) return;
        setCenter({ lat: latN, lon: lonN });
        updateLatLon({ lat: latN, lon: lonN });
      } catch {}
    })();
  }, [selectedCountry, selectedCity]);

  async function submit() {
    try {
      setSaving(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const body: any = {
        name: name.trim(),
        city: city.trim(),
        address: address.trim() || null,
        category,
        shortDescription: shortDescription.trim() || null,
        fullDescription: fullDescription.trim() || null,
      };
      const latNum = lat.trim() ? Number(lat) : NaN;
      const lonNum = lon.trim() ? Number(lon) : NaN;
      const priceNum = price.trim() ? Number(price) : NaN;
      body.lat = latNum;
      body.lon = lonNum;
      body.price = price.trim() ? priceNum : null;
      body.photoUrl = photoBase64.trim() ? photoBase64.trim() : null;

      const res = await fetch("/api/street-fireflies/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error || "Errore invio richiesta");
        return;
      }

      setName("");
      setAddress("");
      setShortDescription("");
      setFullDescription("");
      setPrice("");
      setPhotoBase64("");
      await load();
    } catch (e) {
      console.error(e);
      setError("Errore imprevisto durante l'invio");
    } finally {
      setSaving(false);
    }
  }

  async function geocodeAddress() {
    try {
      const ct = city.trim();
      const addr = address.trim();
      if (!ct || !addr) return;
      const q = encodeURIComponent(`${addr}, ${ct}`);
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, {
        headers: { "Accept-Language": "it" },
      });
      if (!resp.ok) return;
      const arr = await resp.json();
      const latN = arr?.[0]?.lat ? parseFloat(arr[0].lat) : null;
      const lonN = arr?.[0]?.lon ? parseFloat(arr[0].lon) : null;
      if (latN == null || lonN == null || !Number.isFinite(latN) || !Number.isFinite(lonN)) return;
      setCenter({ lat: latN, lon: lonN });
      updateLatLon({ lat: latN, lon: lonN });
    } catch {}
  }

  async function onPickPhoto(file: File | null) {
    if (!file) return;
    const MAX_BYTES = 3.5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      alert('Foto troppo grande. Comprimi l\'immagine (max ~3.5MB).');
      return;
    }
    const toBase64 = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result;
          if (typeof res === 'string') resolve(res);
          else reject(new Error('Impossibile leggere file'));
        };
        reader.onerror = () => reject(reader.error || new Error('Errore lettura file'));
        reader.readAsDataURL(f);
      });
    try {
      const b64 = await toBase64(file);
      setPhotoBase64(b64);
    } catch {
      alert('Errore caricamento foto');
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Street Fireflies"
        subtitle="Proponi una nuova posizione sulla mappa. La richiesta verrà approvata da un admin prima della pubblicazione."
      />

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-3 text-sm">
            <div>
              <label className="block text-xs mb-1 text-gray-300">Nome *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                placeholder="Nome visibile sulla mappa"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Nazione *</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCountry(val);
                  setSelectedCity("");
                  setCity("");
                }}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
              >
                <option value="">Seleziona nazione</option>
                {COUNTRY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Città *</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCity(val);
                  setCity(val);
                }}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                disabled={!selectedCountry}
              >
                <option value="">{!selectedCountry ? "Seleziona prima una nazione" : "Seleziona città"}</option>
                {availableCities.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Via / Indirizzo *</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={geocodeAddress}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                placeholder="Es. Via Roma 10"
              />
              <p className="text-[11px] text-gray-400 mt-1">Scrivi la via: verrà usata per trovare automaticamente la posizione sulla mappa.</p>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Categoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
              >
                <option value="ESCORT">Donna / Escort</option>
                <option value="TRANS">Trans</option>
                <option value="COPPIE">Coppia</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1 text-gray-300">Latitudine</label>
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                  placeholder="(auto)"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-300">Longitudine</label>
                <input
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                  placeholder="(auto)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Seleziona il punto sulla mappa</label>
              <div ref={mapDivRef} className="w-full h-56 rounded-md border border-gray-700 overflow-hidden bg-black/30" />
              <p className="text-[11px] text-gray-400 mt-1">
                Clicca sulla mappa o trascina il marker.
              </p>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Foto (opzionale)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-gray-200"
                onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
              />
              {photoBase64 ? (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoBase64} alt="Anteprima" className="w-full max-h-48 object-cover rounded-md border border-gray-700" />
                  <p className="text-[11px] text-gray-400 mt-1">La foto verrà pubblicata solo dopo approvazione admin.</p>
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Descrizione breve</label>
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Descrizione completa</label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white min-h-[90px]"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Prezzo (opzionale)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                placeholder="Es. 100"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={submit} disabled={saving || !name.trim() || !city.trim() || !address.trim()}>
                {saving ? "Invio…" : "Invia richiesta"}
              </Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Le tue richieste</h2>
            <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
              {loading ? "Aggiorno…" : "Ricarica"}
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-gray-400 border border-dashed border-gray-600 rounded-lg p-4">
              Nessuna richiesta inviata.
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="border border-gray-700 rounded-md px-3 py-2 bg-black/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-white truncate">#{it.id} · {it.name}</div>
                    <div className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 uppercase">
                      {it.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {it.city} · lat: {it.lat} / lon: {it.lon}
                  </div>
                  {it.adminNote && (
                    <div className="text-xs text-gray-300 mt-1">Nota admin: {it.adminNote}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
