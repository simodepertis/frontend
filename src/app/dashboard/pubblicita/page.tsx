"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faShieldHalved, faStar, faGem, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

export default function PubblicitaPage() {
  const [catalog, setCatalog] = useState<Array<{ code: string; label: string; creditsCost: number; durationDays: number }>>([]);
  const [balance, setBalance] = useState(0);
  const [spending, setSpending] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const [c, w] = await Promise.all([
          fetch('/API/credits/catalog'),
          fetch('/API/credits/wallet'),
        ]);
        if (c.ok) { const { products } = await c.json(); setCatalog(products || []); }
        if (w.ok) { const { wallet } = await w.json(); setBalance(wallet?.balance || 0); }
      } catch {}
    })();
  }, []);

  async function spend(code: string) {
    setSpending(code);
    try {
      const res = await fetch('/API/credits/spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || 'Errore spesa crediti'); return; }
      // refresh balance
      try { const w = await fetch('/API/credits/wallet'); if (w.ok) { const { wallet } = await w.json(); setBalance(wallet?.balance || 0); } } catch {}
      alert(`Attivato ${data?.activated?.tier} fino al ${new Date(data?.activated?.expiresAt).toLocaleDateString()}`);
    } finally {
      setSpending("");
    }
  }

  function tierIcon(code: string) {
    if (code.startsWith('GIRL')) return faWandMagicSparkles;
    if (code.startsWith('VIP')) return faCrown;
    if (code.startsWith('TITANIO')) return faShieldHalved;
    if (code.startsWith('ORO')) return faStar;
    if (code.startsWith('ARGENTO')) return faGem;
    return faStar;
  }

  function tierClasses(code: string) {
    if (code.startsWith('GIRL')) return {
      card: 'bg-gradient-to-br from-pink-50 to-rose-100 border-rose-200 hover:shadow-rose-200/60',
      pill: 'bg-rose-500 text-white',
      cta: 'bg-rose-600 hover:bg-rose-700 text-white',
      ring: 'ring-rose-400',
    };
    if (code.startsWith('VIP')) return {
      card: 'bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200 hover:shadow-amber-200/60',
      pill: 'bg-yellow-400 text-black',
      cta: 'bg-yellow-500 hover:bg-yellow-600 text-black',
      ring: 'ring-yellow-400',
    };
    if (code.startsWith('TITANIO')) return {
      card: 'bg-gradient-to-br from-sky-50 to-blue-100 border-blue-200 hover:shadow-blue-200/60',
      pill: 'bg-sky-700 text-white',
      cta: 'bg-sky-700 hover:bg-sky-800 text-white',
      ring: 'ring-sky-500',
    };
    if (code.startsWith('ORO')) return {
      card: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 hover:shadow-amber-200/60',
      pill: 'bg-amber-300 text-black',
      cta: 'bg-amber-400 hover:bg-amber-500 text-black',
      ring: 'ring-amber-400',
    };
    if (code.startsWith('ARGENTO')) return {
      card: 'bg-gradient-to-br from-zinc-50 to-gray-100 border-gray-200 hover:shadow-gray-200/60',
      pill: 'bg-zinc-300 text-neutral-900',
      cta: 'bg-zinc-700 hover:bg-zinc-800 text-white',
      ring: 'ring-zinc-400',
    };
    return {
      card: 'bg-gray-800 border-gray-600',
      pill: 'bg-gray-700 text-gray-200',
      cta: 'bg-blue-600 hover:bg-blue-700 text-white',
      ring: 'ring-gray-500',
    };
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Acquista Pubblicità" subtitle="Aumenta la visibilità con pacchetti e promozioni" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 flex items-center justify-between">
        <div className="text-sm text-gray-300">Saldo crediti: <strong className="text-white">{balance}</strong></div>
        <Link href="/dashboard/crediti" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Ricarica crediti</Link>
      </div>

      {catalog.length === 0 ? (
        <div className="text-sm text-neutral-500">Nessun pacchetto disponibile al momento.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {catalog.map((p) => {
            const s = tierClasses(p.code);
            const popular = p.code.startsWith('VIP');
            return (
              <div key={p.code} className={`relative rounded-2xl border p-5 transition-shadow hover:shadow-xl ${s.card}`}>
                {popular && (
                  <div className="absolute -top-2 right-3 text-[10px] uppercase tracking-wide px-2 py-1 bg-rose-600 text-white rounded-full shadow">
                    Più scelto
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 grid place-items-center rounded-full bg-white/80 ${s.ring} ring-2 text-neutral-800`}>
                    <FontAwesomeIcon icon={tierIcon(p.code)} />
                  </div>
                  <div>
                    <div className="font-extrabold text-lg">{p.label}</div>
                    <div className="text-xs text-neutral-600">Durata {p.durationDays} giorni</div>
                  </div>
                  <span className={`ml-auto text-[11px] px-2 py-1 rounded-full ${s.pill}`}>{p.code.split('_')[0]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="text-neutral-600">Costo</div>
                    <div className="font-semibold">{p.creditsCost} crediti</div>
                  </div>
                  <Button onClick={() => spend(p.code)} disabled={spending===p.code} className={`px-4 ${s.cta}`}>{spending===p.code ? 'Attivazione…' : 'Attiva'}</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
