"use client";

import SectionHeader from "@/components/SectionHeader";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faShieldHalved, faStar, faGem } from "@fortawesome/free-solid-svg-icons";

export default function DashboardAgenziaPage() {
  type AgencyProfile = {
    name?: string;
    description?: string;
    languages?: string[];
    cities?: string[];
    services?: string[];
    contacts?: { phoneCode?: string; phone?: string; email?: string };
    website?: string;
    socials?: Record<string, string>;
  };
  type Req = { id: string; name: string; when: string; duration: string; note?: string; status: "new" | "accepted" | "declined" };

  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [wallet, setWallet] = useState<number | null>(null);
  const [catalog, setCatalog] = useState<Array<{ code: string; label: string; creditsCost: number; durationDays: number }>>([]);
  const [spending, setSpending] = useState<string>("");

  function tierIcon(code: string) {
    if (code.startsWith('VIP')) return faCrown;
    if (code.startsWith('TITANIO')) return faShieldHalved;
    if (code.startsWith('ORO')) return faStar;
    if (code.startsWith('ARGENTO')) return faGem;
    return faStar;
  }
  function tierClasses(code: string) {
    if (code.startsWith('VIP')) return {
      card: 'bg-gradient-to-br from-yellow-900 to-amber-800 border-amber-600 hover:shadow-amber-900/60',
      pill: 'bg-yellow-600 text-yellow-100',
      cta: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      ring: 'ring-yellow-500',
    };
    if (code.startsWith('TITANIO')) return {
      card: 'bg-gradient-to-br from-sky-900 to-blue-800 border-blue-600 hover:shadow-blue-900/60',
      pill: 'bg-sky-600 text-sky-100',
      cta: 'bg-sky-600 hover:bg-sky-700 text-white',
      ring: 'ring-sky-500',
    };
    if (code.startsWith('ORO')) return {
      card: 'bg-gradient-to-br from-amber-900 to-yellow-800 border-amber-600 hover:shadow-amber-900/60',
      pill: 'bg-amber-600 text-amber-100',
      cta: 'bg-amber-600 hover:bg-amber-700 text-white',
      ring: 'ring-amber-500',
    };
    if (code.startsWith('ARGENTO')) return {
      card: 'bg-gradient-to-br from-zinc-800 to-gray-700 border-gray-500 hover:shadow-gray-800/60',
      pill: 'bg-zinc-600 text-zinc-100',
      cta: 'bg-zinc-600 hover:bg-zinc-700 text-white',
      ring: 'ring-zinc-500',
    };
    return {
      card: 'bg-gray-800 border-gray-600',
      pill: 'bg-gray-600 text-gray-200',
      cta: 'bg-blue-600 hover:bg-blue-700 text-white',
      ring: 'ring-gray-500',
    };
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/agency/profile');
        if (r.ok) {
          const { profile } = await r.json();
          setProfile(profile || null);
        }
      } catch {}
      try {
        const q = await fetch('/api/escort/booking/requests');
        if (q.ok) {
          const { requests } = await q.json();
          const mapped: Req[] = (requests || []).slice(0, 5).map((x: any) => ({
            id: String(x.id),
            name: x.name,
            when: x.when,
            duration: x.duration,
            note: x.note || undefined,
            status: x.status === 'ACCEPTED' ? 'accepted' : x.status === 'DECLINED' ? 'declined' : 'new',
          }));
          setRequests(mapped);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [w, c] = await Promise.all([
          fetch('/api/credits/wallet'),
          fetch('/api/credits/catalog'),
        ]);
        if (w.ok) { const { wallet } = await w.json(); setWallet(wallet?.balance ?? 0); }
        if (c.ok) { const { products } = await c.json(); setCatalog(products || []); }
      } catch {}
    })();
  }, []);

  async function spend(code: string) {
    setSpending(code);
    try {
      const res = await fetch('/api/credits/spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || 'Crediti insufficienti'); return; }
      try { const w = await fetch('/api/credits/wallet'); if (w.ok) { const { wallet } = await w.json(); setWallet(wallet?.balance ?? 0); } } catch {}
      alert(`Attivato ${data?.activated?.tier} fino al ${new Date(data?.activated?.expiresAt).toLocaleDateString()}`);
    } finally { setSpending(""); }
  }

  const completion = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      !!profile.name && profile.name.trim().length >= 2,
      Array.isArray(profile.languages) && profile.languages.length > 0,
      Array.isArray(profile.cities) && profile.cities.length > 0,
      Array.isArray(profile.services) && profile.services.length > 0,
      !!profile.contacts?.phone && !!profile.contacts?.email,
      !!profile.website || (profile.socials && Object.values(profile.socials).some(Boolean)),
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard Agenzia" subtitle="Strumenti rapidi e stato profilo" />

      {/* Stato profilo */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="font-semibold">Completamento profilo</div>
          <div className="text-neutral-600">{completion}%</div>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-2 bg-green-600" style={{ width: `${completion}%` }} />
        </div>
        <div className="mt-3 text-sm">
          <Link href="/dashboard/agenzia/compila" className="text-blue-600 hover:underline">Completa/Modifica profilo agenzia</Link>
        </div>
      </div>

      {/* Azioni rapide */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 flex flex-col justify-between">
          <div>
            <div className="font-semibold mb-1 text-white">Gestisci Prenotazioni</div>
            <div className="text-sm text-gray-400">Configura disponibilità e gestisci le richieste dei clienti.</div>
          </div>
          <div className="pt-3"><Link href="/dashboard/prenotazioni" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Apri Prenotazioni</Link></div>
        </div>
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 flex flex-col justify-between">
          <div>
            <div className="font-semibold mb-1 text-white">Promuovi l'Agenzia</div>
            <div className="text-sm text-gray-400">Acquista pacchetti promozionali e Happy Hour.</div>
          </div>
          <div className="pt-3"><Link href="/dashboard/pubblicita" className="px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold">Vai a Pubblicità</Link></div>
        </div>
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 flex flex-col justify-between">
          <div>
            <div className="font-semibold mb-1 text-white">Tour Città</div>
            <div className="text-sm text-gray-400">Pianifica e comunica le date in tour per le tue modelle.</div>
          </div>
          <div className="pt-3"><Link href="/dashboard/tour-citta" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Gestisci Tour</Link></div>
        </div>
      </div>

      {/* Promuovi Agenzia */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-semibold text-white">Promuovi la tua Agenzia</div>
            <div className="text-xs text-neutral-600">Saldo: {wallet ?? '—'} crediti</div>
          </div>
          <Link href="/dashboard/crediti" className="text-sm text-blue-600 hover:underline">Vedi tutti i pacchetti</Link>
        </div>
        {catalog.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessun pacchetto disponibile al momento.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {catalog.slice(0,3).map(p => {
              const s = tierClasses(p.code);
              return (
                <div key={p.code} className={`relative rounded-2xl border p-4 transition-shadow hover:shadow-xl ${s.card}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 grid place-items-center rounded-full bg-gray-700 ${s.ring} ring-2 text-white`}>
                      <FontAwesomeIcon icon={tierIcon(p.code)} />
                    </div>
                    <div>
                      <div className="font-semibold">{p.label}</div>
                      <div className="text-[11px] text-neutral-600">Durata {p.durationDays} giorni</div>
                    </div>
                    <span className={`ml-auto text-[10px] px-2 py-1 rounded-full ${s.pill}`}>{p.code.split('_')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <div className="text-neutral-600">Costo</div>
                      <div className="font-semibold">{p.creditsCost} crediti</div>
                    </div>
                    <Button onClick={() => spend(p.code)} disabled={spending === p.code} className={`px-4 ${s.cta}`}>{spending === p.code ? 'Attivazione…' : 'Attiva'}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Richieste recenti */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Richieste recenti</div>
          <Link href="/dashboard/prenotazioni" className="text-blue-600 hover:underline text-sm">Vedi tutto</Link>
        </div>
        {requests.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessuna richiesta recente.</div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="border rounded-md p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{r.name} · {r.when}</div>
                  <div className="text-xs text-neutral-600">Durata: {r.duration}{r.note ? ` · Note: ${r.note}` : ''}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'accepted' ? 'bg-green-100 text-green-700' : r.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.status === 'accepted' ? 'Accettata' : r.status === 'declined' ? 'Rifiutata' : 'Nuova'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
