"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function AdminQuickMeetingsNormalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams?.get("q") || "").trim();

  const [qInput, setQInput] = useState(q);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState<QuickMeeting[]>([]);
  const [count, setCount] = useState<number>(0);
  const [countVisible, setCountVisible] = useState<number>(0);

  const [skip, setSkip] = useState(0);
  const take = 200;

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("type", "normal");
    p.set("take", String(take));
    p.set("skip", String(skip));
    if (q) p.set("q", q);
    return p.toString();
  }, [q, skip]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("auth-token") || "";
      const res = await fetch(`/api/admin/quick-meetings?${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Errore caricamento Normali");
      setItems((j.normalMeetings || []) as QuickMeeting[]);
      setCount(Number(j?.counts?.normal) || 0);
      setCountVisible(Number(j?.counts?.normalVisible) || 0);
    } catch (e: any) {
      setErr(e?.message || "Errore caricamento Normali");
      setItems([]);
      setCount(0);
      setCountVisible(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSkip(0);
  }, [q]);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  const applySearch = () => {
    const next = qInput.trim();
    router.push(`/dashboard/admin/incontri-veloci/normali${next ? `?q=${encodeURIComponent(next)}` : ""}`);
  };

  useEffect(() => {
    load();
  }, [queryString]);

  const hasPrev = skip > 0;
  const hasNext = skip + take < count;

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
        title="Incontri Veloci · Normali"
        subtitle={q ? `Ricerca: ${q} · Totale DB: ${count} · Visibili: ${countVisible}` : `Totale DB: ${count} · Visibili: ${countVisible}`}
      />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={`/dashboard/admin/annunci${q ? `?q=${encodeURIComponent(q)}` : ""}`}
            className="text-blue-400 text-sm hover:underline"
          >
            ← Torna a Moderazione Annunci
          </Link>
          <div className="flex items-center gap-2">
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applySearch();
                }
              }}
              placeholder="Cerca per telefono..."
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
            />
            <button
              type="button"
              disabled={loading}
              onClick={applySearch}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm text-white disabled:opacity-40"
            >
              Cerca
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || !hasPrev}
              onClick={() => setSkip((s) => Math.max(0, s - take))}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-white disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={loading || !hasNext}
              onClick={() => setSkip((s) => s + take)}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-white disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm mt-3">Caricamento…</div>
        ) : err ? (
          <div className="text-red-300 text-sm mt-3">{err}</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400 text-sm mt-3">Nessun annuncio normale.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {items.map((m) => (
              <div
                key={m.id}
                className="border border-gray-700 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3"
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
