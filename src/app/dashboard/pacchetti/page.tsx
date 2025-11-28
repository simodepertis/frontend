"use client";

import { useEffect, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";

// Pacchetti dedicati SOLO all'utente (cliente), pagati in crediti
const MAP_PACKAGES = [
  {
    code: "MAP_SINGLE_24H",
    label: "Pacchetto Singolo Profilo",
    description: "Accesso completo ad un profilo per 24 ore.",
    creditsCost: 20,
  },
  {
    code: "MAP_5_PROFILES",
    label: "Pacchetto 5 Profili",
    description: "Sblocca fino a 5 profili escort a tua scelta.",
    creditsCost: 80,
  },
  {
    code: "MAP_UNLIMITED_30D",
    label: "Pacchetto Illimitato 30 giorni",
    description: "Accesso illimitato a tutti i profili per 30 giorni.",
    creditsCost: 200,
  },
] as const;

type MapPackageCode = (typeof MAP_PACKAGES)[number]["code"];

export default function PacchettiUtentePage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingCode, setBuyingCode] = useState<MapPackageCode | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
        const res = await fetch("/api/credits/wallet", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const j = await res.json();
        setBalance(j?.wallet?.balance ?? 0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function buy(code: MapPackageCode) {
    setBuyingCode(code);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      if (!token) {
        window.location.href = "/autenticazione?redirect=" + encodeURIComponent("/dashboard/pacchetti");
        return;
      }
      const res = await fetch("/api/credits/spend-by-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = j?.error || "Errore durante l'acquisto del pacchetto";
        if (String(msg).toLowerCase().includes("credit")) {
          alert(msg + "\nVai su 'Acquista crediti' per ricaricare il saldo.");
        } else {
          alert(msg);
        }
        return;
      }
      alert("Pacchetto attivato correttamente.");
      try {
        const w = await fetch("/api/credits/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (w.ok) {
          const jw = await w.json();
          setBalance(jw?.wallet?.balance ?? 0);
        }
      } catch {}
    } catch (e) {
      alert("Errore di connessione, riprova.");
    } finally {
      setBuyingCode(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pacchetti mappa"
        subtitle="Acquista pacchetti per sbloccare i profili sulla mappa usando i tuoi crediti."
      />

      <div className="rounded-xl border bg-gray-800 p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">Saldo crediti disponibile</div>
          <div className="text-2xl font-bold text-white">
            {loading ? "…" : balance ?? "—"} crediti
          </div>
        </div>
        <Button
          onClick={() => (window.location.href = "/dashboard/crediti")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Acquista crediti
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MAP_PACKAGES.map((p) => (
          <div
            key={p.code}
            className="rounded-xl border border-gray-600 bg-gray-800 p-4 flex flex-col justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-white mb-1">{p.label}</div>
              <div className="text-xs text-gray-300 mb-2">{p.description}</div>
              <div className="text-sm text-gray-200">
                Costo: <span className="font-semibold">{p.creditsCost} crediti</span>
              </div>
            </div>
            <div className="pt-3">
              <Button
                disabled={buyingCode === p.code}
                onClick={() => buy(p.code)}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                {buyingCode === p.code ? "Acquisto…" : "Compra con crediti"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  
