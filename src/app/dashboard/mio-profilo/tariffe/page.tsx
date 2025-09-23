"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type RateItem = { duration: string; price: number };

const DURATE = [
  "30 minuti",
  "1 ora",
  "2 ore",
  "3 ore",
  "notte",
  "24 ore",
];

export default function TariffePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incall, setIncall] = useState<RateItem[]>([]);
  const [outcall, setOutcall] = useState<RateItem[]>([]);

  const [selIncallDur, setSelIncallDur] = useState<string>("1 ora");
  const [selOutcallDur, setSelOutcallDur] = useState<string>("1 ora");
  const [inpIncallPrice, setInpIncallPrice] = useState<string>("");
  const [inpOutcallPrice, setInpOutcallPrice] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("auth-token") || "";
        const r = await fetch("/api/profile/tariffe", { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (r.ok) {
          const j = await r.json();
          const rates = j?.rates || {};
          setIncall(Array.isArray(rates.incall) ? rates.incall : []);
          setOutcall(Array.isArray(rates.outcall) ? rates.outcall : []);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  function addIncall() {
    const p = Number(inpIncallPrice);
    if (!Number.isFinite(p) || p < 0) { alert("Prezzo incall non valido"); return; }
    setIncall(prev => {
      const others = prev.filter(x => x.duration !== selIncallDur);
      return [...others, { duration: selIncallDur, price: p }].sort(sortRates);
    });
    setInpIncallPrice("");
  }
  function addOutcall() {
    const p = Number(inpOutcallPrice);
    if (!Number.isFinite(p) || p < 0) { alert("Prezzo outcall non valido"); return; }
    setOutcall(prev => {
      const others = prev.filter(x => x.duration !== selOutcallDur);
      return [...others, { duration: selOutcallDur, price: p }].sort(sortRates);
    });
    setInpOutcallPrice("");
  }
  function sortRates(a:RateItem,b:RateItem){
    const oa = DURATE.indexOf(a.duration); const ob = DURATE.indexOf(b.duration);
    return (oa<0?99:oa) - (ob<0?99:ob);
  }

  async function save() {
    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token") || "";
      const r = await fetch("/api/profile/tariffe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token? { Authorization: `Bearer ${token}` }: {}) },
        body: JSON.stringify({ incall, outcall })
      });
      if (!r.ok) { const j = await r.json().catch(()=>({})); alert(j?.error || "Errore salvataggio tariffe"); return; }
      // Fine flusso: ritorna in Dashboard
      router.push("/dashboard");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Tariffe" subtitle="Seleziona durata e prezzo per Incall e Outcall" />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Incall */}
        <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4">
          <div className="font-semibold text-white">Tariffe Incall</div>
          <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-300">Scegli durata</label>
              <select value={selIncallDur} onChange={(e)=>setSelIncallDur(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
                {DURATE.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-300">Prezzo (EUR)</label>
              <input type="number" min={0} value={inpIncallPrice} onChange={(e)=>setInpIncallPrice(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
            </div>
            <Button onClick={addIncall}>+</Button>
          </div>
          <div className="space-y-2">
            {incall.length === 0 ? (
              <div className="text-sm text-gray-400">Non ci sono tariffe Incall definite</div>
            ) : (
              incall.sort(sortRates).map((r) => (
                <div key={r.duration} className="flex items-center justify-between border border-gray-600 rounded-md px-3 py-2 text-sm">
                  <div>{r.duration}</div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{r.price} EUR</div>
                    <Button variant="secondary" onClick={()=>setIncall(prev=>prev.filter(x=>x.duration!==r.duration))}>Rimuovi</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outcall */}
        <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4">
          <div className="font-semibold text-white">Tariffe Outcall</div>
          <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-300">Scegli durata</label>
              <select value={selOutcallDur} onChange={(e)=>setSelOutcallDur(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
                {DURATE.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-300">Prezzo (EUR)</label>
              <input type="number" min={0} value={inpOutcallPrice} onChange={(e)=>setInpOutcallPrice(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
            </div>
            <Button onClick={addOutcall}>+</Button>
          </div>
          <div className="space-y-2">
            {outcall.length === 0 ? (
              <div className="text-sm text-gray-400">Non ci sono tariffe Outcall definite</div>
            ) : (
              outcall.sort(sortRates).map((r) => (
                <div key={r.duration} className="flex items-center justify-between border border-gray-600 rounded-md px-3 py-2 text-sm">
                  <div>{r.duration}</div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{r.price} EUR</div>
                    <Button variant="secondary" onClick={()=>setOutcall(prev=>prev.filter(x=>x.duration!==r.duration))}>Rimuovi</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Salvo…" : "Salva e continua"}</Button>
      </div>
    </div>
  );
}
