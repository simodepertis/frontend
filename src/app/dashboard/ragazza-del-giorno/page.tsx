"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faStar, faShieldHalved, faCrown, faGem } from "@fortawesome/free-solid-svg-icons";

export default function RagazzaDelGiornoPage() {
  // Candidature (restano in fondo alla pagina)
  type Entry = { id: string; date: string; photo: string; note?: string; status: "in_review" | "approved" | "rejected" };
  const [entries, setEntries] = useState<Entry[]>([]);
  const [date, setDate] = useState("");
  const [photo, setPhoto] = useState("");
  const [note, setNote] = useState("");

  // Catalogo pacchetti (riuso dello schema della pagina crediti)
  const [catalog, setCatalog] = useState<Array<{ code: string; label: string; creditsCost: number; durationDays: number; pricePerDayCredits?: number|null; minDays?: number|null; maxDays?: number|null }>>([]);
  const [daysByCode, setDaysByCode] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { try { const raw = localStorage.getItem("escort-gotd"); if (raw) setEntries(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("escort-gotd", JSON.stringify(entries)); } catch {} }, [entries]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/credits/catalog');
        if (r.ok) {
          const j = await r.json();
          setCatalog(j?.products || []);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  function tierIcon(code: string) {
    if (code.startsWith('GIRL')) return faWandMagicSparkles;
    if (code.startsWith('VIP')) return faCrown;
    if (code.startsWith('TITANIO')) return faShieldHalved;
    if (code.startsWith('ORO')) return faStar;
    if (code.startsWith('ARGENTO')) return faGem;
    return faStar;
  }

  const girlPacks = useMemo(() => catalog.filter(p => p.code.startsWith('GIRL')), [catalog]);
  const otherPacks = useMemo(() => catalog.filter(p => !p.code.startsWith('GIRL')), [catalog]);

  async function activateProduct(code: string) {
    const days = daysByCode[code] ?? 1;
    try {
      const res = await fetch('/api/credits/spend-by-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}` },
        body: JSON.stringify({ code, days })
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || 'Errore attivazione'); return; }
      setNotice(`Pacchetto ${code} attivato per ${days} giorni (scade il ${new Date(data?.activated?.expiresAt).toLocaleDateString()})`);
    } catch { alert('Errore attivazione'); }
  }

  function apply() {
    if (!date || !photo) return;
    setEntries((e) => [...e, { id: `${date}-${Date.now()}`, date, photo, note, status: "in_review" }]);
    setDate(""); setPhoto(""); setNote("");
    alert("Candidatura inviata per revisione.");
  }
  function withdraw(id: string) { setEntries((e) => e.filter(x => x.id !== id)); }

  return (
    <div className="space-y-6">
      <SectionHeader title="Ragazza del Giorno" subtitle="Con Ragazza del Giorno sei sempre in primo piano: badge speciale, prima posizione nella tua città e priorità in homepage." />

      {notice && (
        <div className="rounded-md p-3 text-sm bg-green-50 text-green-800 border border-green-200">{notice}</div>
      )}

      {/* Evidenzia prima i pacchetti GIRL */}
      <div className="rounded-xl border bg-gray-800 p-5">
        <div className="text-white font-semibold mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faWandMagicSparkles} /> Pacchetto "Ragazza del Giorno"</div>
        {loading ? (
          <div className="text-sm text-neutral-400">Caricamento…</div>
        ) : girlPacks.length === 0 ? (
          <div className="text-sm text-neutral-400">Nessun pacchetto disponibile.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {girlPacks.map(p => (
              <div key={p.code} className="relative rounded-2xl border p-5 bg-gradient-to-br from-rose-50 to-pink-100 text-neutral-900">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 grid place-items-center rounded-full bg-white ring-2 ring-rose-400 text-rose-700">
                    <FontAwesomeIcon icon={tierIcon(p.code)} />
                  </div>
                  <div className="font-extrabold text-lg">{p.label}</div>
                  <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-rose-600 text-white">GIRL</span>
                </div>
                {p.pricePerDayCredits ? (
                  <div className="mt-2 grid grid-cols-[1fr,auto,auto] items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-neutral-700">Giorni</label>
                      <input type="number" min={p.minDays || 1} max={p.maxDays || 60} value={daysByCode[p.code] ?? (p.minDays || 1)} onChange={(e)=>setDaysByCode(d=>({ ...d, [p.code]: Math.min(Math.max(Number(e.target.value|| (p.minDays||1)), p.minDays||1), p.maxDays||60) }))} className="bg-white border border-neutral-300 rounded-md px-3 py-2 w-28" />
                      <div className="text-xs text-neutral-600">Range: {p.minDays || 1}–{p.maxDays || 60} giorni</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-neutral-700">Costo</div>
                      <div className="font-semibold">{(p.pricePerDayCredits||0) * (daysByCode[p.code] ?? (p.minDays||1))} crediti</div>
                    </div>
                    <Button onClick={()=>activateProduct(p.code)} className="px-4 bg-rose-600 hover:bg-rose-700 text-white">Acquista</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-neutral-700">Costo</div>
                      <div className="font-semibold">{p.creditsCost} crediti</div>
                    </div>
                    <Button onClick={()=>activateProduct(p.code)} className="px-4 bg-rose-600 hover:bg-rose-700 text-white">Acquista</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Altri pacchetti sotto */}
      <div className="rounded-xl border bg-gray-800 p-5">
        <div className="text-white font-semibold mb-2">Altri pacchetti</div>
        {loading ? (
          <div className="text-sm text-neutral-400">Caricamento…</div>
        ) : otherPacks.length === 0 ? (
          <div className="text-sm text-neutral-400">Nessun pacchetto disponibile.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {otherPacks.map(p => (
              <div key={p.code} className="relative rounded-2xl border p-5 bg-gray-50 text-neutral-900">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 grid place-items-center rounded-full bg-white ring-2 ring-neutral-300 text-neutral-800">
                    <FontAwesomeIcon icon={tierIcon(p.code)} />
                  </div>
                  <div className="font-extrabold text-lg">{p.label}</div>
                  <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-neutral-800 text-white">{p.code.split('_')[0]}</span>
                </div>
                {p.pricePerDayCredits ? (
                  <div className="mt-2 grid grid-cols-[1fr,auto,auto] items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-neutral-700">Giorni</label>
                      <input type="number" min={p.minDays || 1} max={p.maxDays || 60} value={daysByCode[p.code] ?? (p.minDays || 1)} onChange={(e)=>setDaysByCode(d=>({ ...d, [p.code]: Math.min(Math.max(Number(e.target.value|| (p.minDays||1)), p.minDays||1), p.maxDays||60) }))} className="bg-white border border-neutral-300 rounded-md px-3 py-2 w-28" />
                      <div className="text-xs text-neutral-600">Range: {p.minDays || 1}–{p.maxDays || 60} giorni</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-neutral-700">Costo</div>
                      <div className="font-semibold">{(p.pricePerDayCredits||0) * (daysByCode[p.code] ?? (p.minDays||1))} crediti</div>
                    </div>
                    <Button onClick={()=>activateProduct(p.code)} className="px-4">Acquista</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-neutral-700">Costo</div>
                      <div className="font-semibold">{p.creditsCost} crediti</div>
                    </div>
                    <Button onClick={()=>activateProduct(p.code)} className="px-4">Acquista</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regole + candidatura (sotto) */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-2 text-white">Regole</div>
        <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
          <li>Una candidatura per giorno per profilo.</li>
          <li>La foto deve rispettare le linee guida del sito.</li>
          <li>La selezione è a discrezione della redazione.</li>
        </ul>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-3">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="URL Foto" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opzionale)" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <Button onClick={apply} disabled={!date || !photo}>Invia candidatura</Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-3 text-white">Le tue candidature ({entries.length})</div>
        {entries.length === 0 ? (
          <div className="text-sm text-gray-400">Nessuna candidatura inviata.</div>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="border border-gray-600 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-gray-300">
                  <div className="font-medium text-white">{e.date}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[360px]">{e.photo}</div>
                  {e.note && <div className="text-xs text-gray-400">Note: {e.note}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${e.status === 'approved' ? 'bg-green-900/40 text-green-300 border-green-700' : e.status === 'rejected' ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-yellow-900/30 text-yellow-300 border-yellow-700'}`}>
                    {e.status === 'approved' ? 'Approvata' : e.status === 'rejected' ? 'Rifiutata' : 'In revisione'}
                  </span>
                  <Button variant="secondary" onClick={() => withdraw(e.id)}>Ritira</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
