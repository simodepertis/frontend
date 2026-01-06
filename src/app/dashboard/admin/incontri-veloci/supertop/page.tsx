"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SectionHeader from "@/components/SectionHeader";

type QuickMeeting = {
  id: number;
  title: string;
  city: string;
  category: string;
  isActive: boolean;
  userId: number | null;
  isSuperTop?: boolean;
};

export default function AdminQuickMeetingsSuperTopPage() {
  const searchParams = useSearchParams();
  const q = (searchParams?.get("q") || "").trim();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState<QuickMeeting[]>([]);
  const [count, setCount] = useState<number>(0);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("type", "supertop");
    p.set("take", "2000");
    if (q) p.set("q", q);
    return p.toString();
  }, [q]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("auth-token") || "";
      const res = await fetch(`/api/admin/quick-meetings?${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Errore caricamento SuperTop");
      setItems((j.superTopMeetings || []) as QuickMeeting[]);
      setCount(Number(j?.counts?.superTop) || 0);
    } catch (e: any) {
      setErr(e?.message || "Errore caricamento SuperTop");
      setItems([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [queryString]);

  async function deleteQuickMeeting(id: number) {
    if (!window.confirm("Sei sicuro di voler eliminare questo annuncio di incontro veloce?")) return;
    try {
      const token = localStorage.getItem("auth-token") || "";
      const res = await fetch(`/api/admin/quick-meetings?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Errore eliminazione");
      setItems((prev) => prev.filter((x) => x.id !== id));
      setCount((c) => Math.max(0, c - 1));
    } catch (e: any) {
      alert(e?.message || "Errore eliminazione");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Incontri Veloci · SuperTop"
        subtitle={q ? `Ricerca: ${q} · Totale: ${count}` : `Totale: ${count}`}
      />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={`/dashboard/admin/annunci${q ? `?q=${encodeURIComponent(q)}` : ""}`}
            className="text-blue-400 text-sm hover:underline"
          >
            ← Torna a Moderazione Annunci
          </Link>
          <div className="text-xs text-gray-400">SuperTop completi (non paginati)</div>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm mt-3">Caricamento…</div>
        ) : err ? (
          <div className="text-red-300 text-sm mt-3">{err}</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400 text-sm mt-3">Nessun annuncio SuperTop.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {items.map((m) => (
              <div
                key={m.id}
                className="border border-yellow-500/30 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-white font-semibold text-sm">#{m.id} · {m.title}</div>
                  <div className="text-xs text-gray-400">
                    {m.city} · {m.category} · {m.userId ? `User #${m.userId}` : "BOT/IMPORT"} · {m.isActive ? "Attivo" : "Disattivato"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/admin/incontri-veloci/dettaglio?id=${m.id}`}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs text-white"
                  >
                    Modifica
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteQuickMeeting(m.id)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs text-white"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
