"use client";

import { useEffect, useMemo, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";

type AdminSubmission = {
  id: number;
  name: string;
  city: string;
  address?: string | null;
  lat: number;
  lon: number;
  category: string;
  shortDescription: string | null;
  fullDescription: string | null;
  price: number | null;
  photoUrl?: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user?: { id: number; email: string; nome: string };
  streetEscort?: { id: number; name: string } | null;
};

export default function AdminStreetFirefliesRequestsPage() {
  const [status, setStatus] = useState<string>("PENDING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminSubmission[]>([]);
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [workingId, setWorkingId] = useState<number | null>(null);

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("auth-token") || "" : ""), []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const qs = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`/api/admin/street-fireflies-submissions${qs}`, {
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
  }, [status]);

  async function action(id: number, act: "APPROVE" | "REJECT") {
    try {
      setWorkingId(id);
      setError(null);
      const res = await fetch("/api/admin/street-fireflies-submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, action: act, adminNote: adminNote[id] || null }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error || "Errore aggiornamento richiesta");
        return;
      }
      await load();
    } catch (e) {
      console.error(e);
      setError("Errore imprevisto durante l'azione");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Richieste Street Fireflies"
        subtitle="Approva o rifiuta le proposte inviate dagli utenti"
      />

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs mb-1 text-gray-300">Filtro stato</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
            >
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex-1" />
          <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Aggiorno…" : "Ricarica"}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-600 rounded-lg p-4">
          Nessuna richiesta.
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          {items.map((it) => (
            <div key={it.id} className="border border-gray-700 rounded-md px-3 py-2 bg-black/30">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-white truncate">#{it.id} · {it.name}</div>
                <div className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 uppercase">
                  {it.status}
                </div>
              </div>
              <div className="text-xs text-gray-400 truncate">
                {it.city} · lat: {it.lat} / lon: {it.lon} · {it.category}
              </div>
              {it.address && (
                <div className="text-xs text-gray-300 mt-1">Via: {it.address}</div>
              )}
              {it.user && (
                <div className="text-xs text-gray-300 mt-1">Utente: {it.user.nome} · {it.user.email}</div>
              )}
              {it.shortDescription && (
                <div className="text-xs text-gray-300 mt-1">{it.shortDescription}</div>
              )}

              {it.photoUrl && (
                <div className="mt-2">
                  <div className="text-[11px] text-gray-400 mb-1">Foto proposta (in attesa)</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.photoUrl}
                    alt="Foto proposta"
                    className="w-full max-w-[280px] rounded-md border border-gray-700 object-cover"
                  />
                </div>
              )}

              <div className="mt-2 grid md:grid-cols-3 gap-2 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1 text-gray-300">Nota admin (opzionale)</label>
                  <input
                    value={adminNote[it.id] ?? it.adminNote ?? ""}
                    onChange={(e) => setAdminNote((m) => ({ ...m, [it.id]: e.target.value }))}
                    className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                    placeholder="Motivazione rifiuto o note"
                    disabled={it.status !== "PENDING"}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => action(it.id, "REJECT")}
                    disabled={it.status !== "PENDING" || workingId === it.id}
                  >
                    Rifiuta
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => action(it.id, "APPROVE")}
                    disabled={it.status !== "PENDING" || workingId === it.id}
                  >
                    Approva
                  </Button>
                </div>
              </div>

              {it.streetEscort && (
                <div className="text-xs text-gray-400 mt-2">Creato Street Firefly: #{it.streetEscort.id} · {it.streetEscort.name}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
