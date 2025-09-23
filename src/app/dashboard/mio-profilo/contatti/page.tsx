"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ContattiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    apps: [] as string[],
    note: "",
    emailBooking: "",
    website: "",
    noAnonymous: false,
  });

  function toggleApp(k: string) {
    setForm((f) => ({
      ...f,
      apps: f.apps.includes(k) ? f.apps.filter((x) => x !== k) : [...f.apps, k],
    }));
  }

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("auth-token") || "";
        const r = await fetch("/api/profile/contatti", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (r.ok) {
          const j = await r.json();
          if (j?.contacts) setForm((p) => ({ ...p, ...j.contacts }));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token") || "";
      const r = await fetch("/api/profile/contatti", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error || "Errore salvataggio contatti");
        return;
      }
      // Avanza allo step successivo: Biografia
      router.push("/dashboard/escort/compila/biografia");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Contatti" subtitle="Numero di telefono, e-mail di prenotazione e app disponibili" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Numero di telefono</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="es. +39 351 123 4567"
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
            />
            <div className="text-xs text-gray-400">Un numero valido è richiesto per gli annunci.</div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">E-mail di prenotazione</label>
            <input
              value={form.emailBooking}
              onChange={(e) => setForm((f) => ({ ...f, emailBooking: e.target.value }))}
              placeholder="es. mia@email.it"
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Sito web</label>
            <input
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://..."
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">App disponibili</label>
            <div className="flex flex-wrap gap-2">
              {[
                { k: "viber", l: "Viber" },
                { k: "whatsapp", l: "Whatsapp" },
                { k: "telegram", l: "Telegram" },
              ].map((a) => (
                <button
                  key={a.k}
                  onClick={() => toggleApp(a.k)}
                  className={`px-3 py-1 rounded-full text-xs border ${form.apps.includes(a.k) ? "bg-blue-600 text-white border-blue-500" : "bg-gray-700 text-gray-200 border-gray-600"}`}
                >
                  {a.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[auto,1fr] gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.noAnonymous}
              onChange={(e) => setForm((f) => ({ ...f, noAnonymous: e.target.checked }))}
            />
            No anonimi
          </label>
          <input
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Istruzioni (SMS e chiamate / solo Whatsapp…)"
            className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Salvo…" : "Salva e continua"}</Button>
        </div>
      </div>
    </div>
  );
}
