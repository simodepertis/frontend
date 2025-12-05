"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { COUNTRIES_CITIES, COUNTRY_LIST } from "@/lib/internationalCities";

interface StreetEscort {
  id: number;
  name: string;
  city: string;
  lat: number | null;
  lon: number | null;
  shortDescription: string | null;
  fullDescription: string | null;
  price: number | null;
  active: boolean;
  category: string;
}

interface StreetEscortPhoto {
  id: number;
  streetEscortId: number;
  url: string;
  isCensored: boolean;
}

export default function AdminStreetFirefliesPage() {
  const [items, setItems] = useState<StreetEscort[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StreetEscort | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [active, setActive] = useState(true);
  const [category, setCategory] = useState<string>("ESCORT");

  const [photos, setPhotos] = useState<StreetEscortPhoto[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>("");

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [center, setCenter] = useState<{ lat: number; lon: number }>({ lat: 45.4642, lon: 9.19 });
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const availableCities = selectedCountry ? COUNTRIES_CITIES[selectedCountry]?.cities || [] : [];

  function resetForm() {
    setEditing(null);
    setName("");
    setCity("");
    setLat("");
    setLon("");
    setShortDescription("");
    setFullDescription("");
    setPrice("");
    setActive(true);
    setCategory("ESCORT");
    setPhotos([]);
    setNewPhotoUrl("");
    setSelectedCountry("");
    setSelectedCity("");
    setCenter({ lat: 45.4642, lon: 9.19 });
  }

  function fillFormFrom(item: StreetEscort) {
    setEditing(item);
    setName(item.name || "");
    setCity(item.city || "");
    setLat(item.lat != null ? String(item.lat) : "");
    setLon(item.lon != null ? String(item.lon) : "");
    setShortDescription(item.shortDescription || "");
    setFullDescription(item.fullDescription || "");
    setPrice(item.price != null ? String(item.price) : "");
    setActive(item.active);
    setCategory(item.category || "ESCORT");
    setSelectedCity(item.city || "");
    setSelectedCountry("");
    if (typeof item.lat === "number" && typeof item.lon === "number") {
      setCenter({ lat: item.lat, lon: item.lon });
    }
    loadPhotos(item.id);
  }

  function updateLatLon(pos: { lat: number; lon: number }) {
    setLat(String(pos.lat));
    setLon(String(pos.lon));
  }

  async function loadPhotos(streetEscortId: number) {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const res = await fetch(`/api/admin/street-escorts-photos?streetEscortId=${streetEscortId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(j?.error || "Errore caricamento foto");
        setPhotos([]);
        return;
      }
      setPhotos(j.photos || []);
    } catch (e) {
      console.error(e);
      setPhotos([]);
    }
  }

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

  async function addPhoto() {
    if (!editing || !newPhotoUrl.trim()) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const res = await fetch("/api/admin/street-escorts-photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ streetEscortId: editing.id, url: newPhotoUrl.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || "Errore aggiunta foto");
        return;
      }
      setNewPhotoUrl("");
      await loadPhotos(editing.id);
    } catch (e) {
      console.error(e);
      alert("Errore imprevisto durante l'aggiunta della foto");
    }
  }

  async function removePhoto(id: number) {
    if (!editing) return;
    if (!window.confirm("Eliminare questa foto?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const res = await fetch(`/api/admin/street-escorts-photos?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || "Errore eliminazione foto");
        return;
      }
      await loadPhotos(editing.id);
    } catch (e) {
      console.error(e);
      alert("Errore imprevisto durante l'eliminazione della foto");
    }
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const res = await fetch("/api/admin/street-escorts", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error || "Errore caricamento Street Fireflies");
        setItems([]);
        return;
      }
      setItems(j.items || []);
    } catch (e) {
      console.error(e);
      setError("Errore imprevisto durante il caricamento");
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
    })();
  }, [center.lat, center.lon]);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || !markerRef.current) return;
    try {
      markerRef.current.setLatLng([center.lat, center.lon]);
      mapRef.current.setView([center.lat, center.lon]);
    } catch {}
  }, [center, leafletReady]);

  async function save() {
    try {
      setSaving(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const body: any = {
        name,
        city,
        shortDescription: shortDescription || null,
        fullDescription: fullDescription || null,
        active,
        category,
      };
      const latNum = lat.trim() ? Number(lat) : NaN;
      const lonNum = lon.trim() ? Number(lon) : NaN;
      const priceNum = price.trim() ? Number(price) : NaN;
      if (Number.isFinite(latNum)) body.lat = latNum; else body.lat = null;
      if (Number.isFinite(lonNum)) body.lon = lonNum; else body.lon = null;
      if (Number.isFinite(priceNum)) body.price = priceNum; else body.price = null;

      const isEdit = !!editing;
      const res = await fetch("/api/admin/street-escorts", {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(isEdit ? { id: editing!.id, ...body } : body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error || "Errore salvataggio Street Firefly");
        return;
      }
      resetForm();
      await load();
    } catch (e) {
      console.error(e);
      setError("Errore imprevisto durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Vuoi davvero eliminare questa Street Firefly?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const res = await fetch(`/api/admin/street-escorts?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || "Errore eliminazione");
        return;
      }
      if (editing && editing.id === id) {
        resetForm();
      }
      await load();
    } catch (e) {
      console.error(e);
      alert("Errore imprevisto durante l'eliminazione");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Street Fireflies (Admin)"
        subtitle="Gestisci le escort speciali visibili solo sulla mappa Street Fireflies"
      />

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Colonna sinistra: lista */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white">Elenco Street Fireflies</h2>
            <Button
              size="sm"
              variant="secondary"
              onClick={load}
              disabled={loading}
            >
              {loading ? "Aggiorno…" : "Ricarica"}
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-gray-400 border border-dashed border-gray-600 rounded-lg p-4">
              Nessuna Street Firefly creata.
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-3 border border-gray-700 rounded-md px-3 py-2 bg-black/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">
                        #{it.id} · {it.name}
                      </span>
                      {!it.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 uppercase">
                          disattivata
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {it.city} · lat: {it.lat ?? "-"} / lon: {it.lon ?? "-"}
                    </div>
                    {it.shortDescription && (
                      <div className="text-xs text-gray-300 truncate mt-1">{it.shortDescription}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => fillFormFrom(it)}>
                      Modifica
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-xs"
                      onClick={() => remove(it.id)}
                    >
                      Elimina
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonna destra: form + foto */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                {editing ? `Modifica #${editing.id}` : "Nuova Street Firefly"}
              </h2>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Annulla modifica
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Nome *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                placeholder="Nome visibile all'utente"
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
                  placeholder="45.4642"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-300">Longitudine</label>
                <input
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                  placeholder="9.19"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="block text-xs mb-1 text-gray-300">Seleziona il punto sulla mappa</label>
              <div
                ref={mapDivRef}
                className="w-full h-56 rounded-md border border-gray-700 overflow-hidden bg-black/30"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Usa la mappa per scegliere la posizione esatta: clicca sulla mappa o trascina il marker. I campi Latitudine e
                Longitudine verranno aggiornati automaticamente.
              </p>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Descrizione breve</label>
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                placeholder="Testo mostrato sulla card/mappa"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Descrizione completa</label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white min-h-[90px]"
                placeholder="Dettagli completi (verranno usati nella pagina profilo)"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-300">Prezzo di riferimento (opzionale, in crediti o EUR)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                placeholder="Es. 100"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="sf-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-500 bg-gray-900"
              />
              <label htmlFor="sf-active" className="text-xs text-gray-300">
                Attiva su Street Fireflies
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={save} disabled={saving || !name || !city}>
                {saving ? "Salvataggio…" : editing ? "Salva modifiche" : "Crea"}
              </Button>
            </div>
          </div>

          {editing && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-3 text-sm mt-4">
              <h3 className="text-sm font-semibold text-white">Foto Street Firefly</h3>
              <p className="text-xs text-gray-300">
                Le foto caricate qui sono considerate <strong>già censurate</strong>. Verranno mostrate nella pagina pubblica
                solo in versione censurata.
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {photos.length === 0 && (
                  <div className="text-xs text-gray-400">Nessuna foto caricata per questa Street Firefly.</div>
                )}
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 border border-gray-700 rounded-md px-2 py-1 bg-black/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt="Foto Street Firefly"
                        className="h-12 w-12 rounded object-cover flex-shrink-0"
                      />
                      <div className="text-xs text-gray-300 truncate">ID {p.id}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-xs"
                      onClick={() => removePhoto(p.id)}
                    >
                      Elimina
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-2">
                <label className="block text-xs mb-1 text-gray-300">Nuova foto (URL)</label>
                <input
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                  placeholder="Incolla qui l'URL dell'immagine censurata"
                />
                <Button size="sm" onClick={addPhoto} disabled={!newPhotoUrl.trim()}>
                  Aggiungi foto
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
