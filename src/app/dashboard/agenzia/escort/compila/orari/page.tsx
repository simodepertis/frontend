"use client";

import SectionHeader from "@/components/SectionHeader";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Day = "Lun" | "Mar" | "Mer" | "Gio" | "Ven" | "Sab" | "Dom";
const DAYS: Day[] = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

type Slot = { from: string; to: string };

type WorkingHours = {
  mode: "custom" | "same" | "247";
  same?: Slot[];
  perDay?: { [K in Day]?: Slot[] };
  vacations?: Array<{ from: string; to: string }>;
};

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const escortUserId = Number(params?.get("escortUserId") || 0);
  const q = escortUserId ? `?escortUserId=${encodeURIComponent(String(escortUserId))}` : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wh, setWh] = useState<WorkingHours>({ mode: "247", same: [{ from: "00:00", to: "23:59" }] });

  useEffect(() => {
    (async () => {
      if (!escortUserId) { setLoading(false); return; }
      try {
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch(`/api/agency/escort/orari?escortUserId=${escortUserId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const j = await res.json();
          if (j?.workingHours) setWh(j.workingHours);
        }
      } finally { setLoading(false); }
    })();
  }, [escortUserId]);

  function addSame() {
    setWh((p) => ({ ...p, same: [...(p.same || []), { from: "09:00", to: "18:00" }] }));
  }
  function rmSame(i: number) {
    setWh((p) => ({ ...p, same: (p.same || []).filter((_, ix) => ix !== i) }));
  }

  function addPerDay(d: Day) {
    setWh((p) => ({
      ...p,
      perDay: { ...(p.perDay || {}), [d]: [...(p.perDay?.[d] || []), { from: "09:00", to: "18:00" }] },
    }));
  }
  function rmPerDay(d: Day, i: number) {
    setWh((p) => ({
      ...p,
      perDay: { ...(p.perDay || {}), [d]: (p.perDay?.[d] || []).filter((_, ix) => ix !== i) },
    }));
  }

  function addVacation() {
    setWh((p) => ({ ...p, vacations: [...(p.vacations || []), { from: "", to: "" }] }));
  }
  function rmVacation(i: number) {
    setWh((p) => ({ ...p, vacations: (p.vacations || []).filter((_, ix) => ix !== i) }));
  }

  async function save() {
    if (!escortUserId) { alert('escortUserId mancante'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/agency/escort/orari', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ escortUserId, workingHours: wh })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || 'Errore salvataggio orari');
        return;
      }
      router.push(`/dashboard/agenzia/escort/compila/tariffe${q}`);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Orari (Escort)" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <>
            <div className="flex gap-2">
              {([
                { k: "custom", l: "Orario personalizzato" },
                { k: "same", l: "Lo stesso ogni giorno" },
                { k: "247", l: "Sono disponibile 24/7" },
              ] as any[]).map((x) => (
                <button
                  key={x.k}
                  onClick={() => setWh((p) => ({ ...p, mode: x.k }))}
                  className={`px-3 py-1 rounded-full text-sm ${wh.mode === x.k ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`}
                >
                  {x.l}
                </button>
              ))}
            </div>

            {wh.mode === "same" && (
              <div className="space-y-2">
                {(wh.same || []).map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                    <input
                      value={s.from}
                      onChange={(e) =>
                        setWh((p) => {
                          const a = [...(p.same || [])];
                          a[i] = { ...a[i], from: e.target.value };
                          return { ...p, same: a };
                        })
                      }
                      className="inp"
                      type="time"
                    />
                    <input
                      value={s.to}
                      onChange={(e) =>
                        setWh((p) => {
                          const a = [...(p.same || [])];
                          a[i] = { ...a[i], to: e.target.value };
                          return { ...p, same: a };
                        })
                      }
                      className="inp"
                      type="time"
                    />
                    <Button variant="secondary" onClick={() => rmSame(i)}>
                      Rimuovi
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" onClick={addSame}>
                  + Aggiungi fascia
                </Button>
              </div>
            )}

            {wh.mode === "custom" && (
              <div className="space-y-4">
                {DAYS.map((d) => (
                  <div key={d} className="space-y-2">
                    <div className="text-sm text-gray-300">{d}</div>
                    {(wh.perDay?.[d] || []).map((s, i) => (
                      <div key={i} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                        <input
                          value={s.from}
                          onChange={(e) =>
                            setWh((p) => {
                              const arr = [...(p.perDay?.[d] || [])];
                              arr[i] = { ...arr[i], from: e.target.value };
                              return { ...p, perDay: { ...(p.perDay || {}), [d]: arr } };
                            })
                          }
                          className="inp"
                          type="time"
                        />
                        <input
                          value={s.to}
                          onChange={(e) =>
                            setWh((p) => {
                              const arr = [...(p.perDay?.[d] || [])];
                              arr[i] = { ...arr[i], to: e.target.value };
                              return { ...p, perDay: { ...(p.perDay || {}), [d]: arr } };
                            })
                          }
                          className="inp"
                          type="time"
                        />
                        <Button variant="secondary" onClick={() => rmPerDay(d, i)}>
                          Rimuovi
                        </Button>
                      </div>
                    ))}
                    <Button variant="secondary" onClick={() => addPerDay(d)}>
                      + Aggiungi fascia
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {wh.mode === "247" && <div className="text-sm text-gray-300">Disponibilità continua. Nessuna fascia oraria specifica.</div>}

            <div className="pt-4 space-y-2">
              <div className="font-semibold text-white">Vacanze</div>
              {(wh.vacations || []).map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                  <input
                    type="date"
                    value={v.from}
                    onChange={(e) =>
                      setWh((p) => {
                        const arr = [...(p.vacations || [])];
                        arr[i] = { ...arr[i], from: e.target.value };
                        return { ...p, vacations: arr };
                      })
                    }
                    className="inp"
                  />
                  <input
                    type="date"
                    value={v.to}
                    onChange={(e) =>
                      setWh((p) => {
                        const arr = [...(p.vacations || [])];
                        arr[i] = { ...arr[i], to: e.target.value };
                        return { ...p, vacations: arr };
                      })
                    }
                    className="inp"
                  />
                  <Button variant="secondary" onClick={() => rmVacation(i)}>
                    Rimuovi
                  </Button>
                </div>
              ))}
              <Button variant="secondary" onClick={addVacation}>
                + Aggiungi vacanza
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <a href={`/dashboard/agenzia/escort/compila${q}`} className="text-sm text-blue-400 hover:underline">
                « Torna all'hub
              </a>
              <Button onClick={save} disabled={saving || !escortUserId}>
                {saving ? "Salvataggio…" : "Salva e continua"}
              </Button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .inp { background:#374151; border:1px solid #4b5563; color:#fff; border-radius:0.375rem; padding:0.5rem 0.75rem; }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Caricamento…</div>}>
      <Inner />
    </Suspense>
  );
}
