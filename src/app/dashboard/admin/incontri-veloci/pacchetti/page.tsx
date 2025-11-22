"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";

interface QuickMeetingProduct {
  id: number;
  code: string;
  label: string;
  type: string;
  quantityPerWindow: number;
  durationDays: number;
  creditsCost: number;
}

export default function AdminQuickMeetingPackagesPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [items, setItems] = useState<QuickMeetingProduct[]>([]);
  const [editCosts, setEditCosts] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") || "" : "";
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/admin/quick-meeting-packages", { headers });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const list: QuickMeetingProduct[] = data.items || [];
      setItems(list);
      const initial: Record<number, string> = {};
      list.forEach((p) => {
        initial[p.id] = String(p.creditsCost);
      });
      setEditCosts(initial);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function savePrice(id: number) {
    const raw = editCosts[id];
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      alert("Inserisci un prezzo in crediti valido");
      return;
    }
    setSavingId(id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") || "" : "";
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch("/api/admin/quick-meeting-packages", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id, creditsCost: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Errore aggiornamento prezzo");
        return;
      }
      await load();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Admin · Pacchetti Incontri Veloci"
        subtitle="Modifica manualmente il prezzo in crediti dei pacchetti quick meeting (giorno, notte, SuperTop)"
      />

      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento pacchetti...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun pacchetto trovato.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-200">
              <thead>
                <tr className="bg-gray-800 border-b border-gray-700">
                  <th className="px-3 py-2 text-left font-semibold">Codice</th>
                  <th className="px-3 py-2 text-left font-semibold">Label</th>
                  <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                  <th className="px-3 py-2 text-left font-semibold">Durata</th>
                  <th className="px-3 py-2 text-left font-semibold">Quantità</th>
                  <th className="px-3 py-2 text-left font-semibold">Prezzo (crediti)</th>
                  <th className="px-3 py-2 text-left font-semibold">Azione</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/70">
                    <td className="px-3 py-2 font-mono text-xs">{p.code}</td>
                    <td className="px-3 py-2">{p.label}</td>
                    <td className="px-3 py-2 text-xs">
                      {p.code === "IMMEDIATE"
                        ? "Risalita immediata"
                        : p.code.startsWith("SUPERTOP_")
                        ? "SuperTop"
                        : p.type === "DAY"
                        ? "Giorno"
                        : p.type === "NIGHT"
                        ? "Notte"
                        : p.type}
                    </td>
                    <td className="px-3 py-2 text-xs">{p.durationDays} {p.type === "NIGHT" ? (p.durationDays === 1 ? "notte" : "notti") : p.durationDays === 1 ? "giorno" : "giorni"}</td>
                    <td className="px-3 py-2 text-xs">{p.quantityPerWindow}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={editCosts[p.id] ?? ""}
                        onChange={(e) =>
                          setEditCosts((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        className="w-28 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={savingId === p.id}
                        onClick={() => savePrice(p.id)}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingId === p.id ? "Salvataggio..." : "Salva"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
