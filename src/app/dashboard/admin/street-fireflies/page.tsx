"use client";

import { useEffect, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";

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

        {/* Colonna destra: form */}
        <div className="md:col-span-1">
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
              <label className="block text-xs mb-1 text-gray-300">Città *</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                placeholder="Es. Milano"
              />
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
        </div>
      </div>
    </div>
  );
}
