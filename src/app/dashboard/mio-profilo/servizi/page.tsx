"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SERVICE_GROUPS } from "@/data/services";

type ServiceState = {
  [key: string]: { enabled: boolean; price?: number };
};

export default function ServiziPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<ServiceState>({});

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("auth-token") || "";
        const r = await fetch("/api/profile/servizi", { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (r.ok) {
          const j = await r.json();
          setState(j?.services || {});
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggle(key: string) {
    setState((s) => ({
      ...s,
      [key]: { enabled: !s?.[key]?.enabled, price: s?.[key]?.price ?? 0 },
    }));
  }

  function setPrice(key: string, v: string) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return;
    setState((s) => ({
      ...s,
      [key]: { enabled: s?.[key]?.enabled ?? false, price: n },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token") || "";
      const r = await fetch("/api/profile/servizi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ services: state }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error || "Errore salvataggio servizi");
        return;
      }
      // Avanza a Orari
      router.push("/dashboard/escort/compila/orari");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Servizi" subtitle="Seleziona i servizi e opzionalmente il prezzo per ciascuno" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-6">
        {SERVICE_GROUPS.map((g) => (
          <div key={g.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white">{g.name}</div>
              <div className="text-xs text-gray-400">
                {g.items.filter((i) => state?.[i.key]?.enabled).length}/{g.items.length}
              </div>
            </div>
            <div className="space-y-2">
              {g.items.map((it) => {
                const st = state?.[it.key] || { enabled: false, price: 0 };
                return (
                  <div key={it.key} className={`flex items-center justify-between border rounded-md px-3 py-2 ${st.enabled ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-900'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggle(it.key)} className={`w-8 h-8 rounded-full grid place-items-center text-xs ${st.enabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{st.enabled ? '✓' : '+'}</button>
                      <div className="text-sm">{it.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-400">EUR</div>
                      <input
                        type="number"
                        min={0}
                        value={st.price ?? 0}
                        onChange={(e) => setPrice(it.key, e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md px-2 py-1 w-24"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Salvo…" : "Salva e continua"}</Button>
        </div>
      </div>
    </div>
  );
}
