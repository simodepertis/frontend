"use client";

import SectionHeader from "@/components/SectionHeader";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faShieldHalved, faStar, faGem } from "@fortawesome/free-solid-svg-icons";

export default function EscortDashboardPage() {
  const [availableBooking, setAvailableBooking] = useState(false);
  const [availableChat, setAvailableChat] = useState(false);
  const [wallet, setWallet] = useState<number | null>(null);
  const [catalog, setCatalog] = useState<Array<{ code: string; label: string; creditsCost: number; durationDays: number }>>([]);
  const [spending, setSpending] = useState<string>("");

  useEffect(() => {
    try {
      const a = localStorage.getItem("escort-available-booking");
      const c = localStorage.getItem("escort-available-chat");
      if (a) setAvailableBooking(a === "true");
      if (c) setAvailableChat(c === "true");
    } catch {}
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
      // reload wallet
      try { const w = await fetch('/api/credits/wallet'); if (w.ok) { const { wallet } = await w.json(); setWallet(wallet?.balance ?? 0); } } catch {}
      alert(`Attivato ${data?.activated?.tier} fino al ${new Date(data?.activated?.expiresAt).toLocaleDateString()}`);
    } finally { setSpending(""); }
  }

  function tierIcon(code: string) {
    if (code.startsWith('VIP')) return faCrown;
    if (code.startsWith('TITANIO')) return faShieldHalved;
    if (code.startsWith('ORO')) return faStar;
    if (code.startsWith('ARGENTO')) return faGem;
    return faStar;
  }
  function tierClasses(code: string) {
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
      card: 'bg-white border-neutral-200',
      pill: 'bg-neutral-200 text-neutral-800',
      cta: 'bg-neutral-900 hover:bg-black text-white',
      ring: 'ring-neutral-300',
    };
  }
  useEffect(() => {
    try { localStorage.setItem("escort-available-booking", String(availableBooking)); } catch {}
  }, [availableBooking]);
  useEffect(() => {
    try { localStorage.setItem("escort-available-chat", String(availableChat)); } catch {}
  }, [availableChat]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard Escort" subtitle="Strumenti rapidi per la tua visibilità" />

      {/* Happy Hour */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <div className="text-sm uppercase font-semibold text-blue-400">Happy Hour</div>
          <div className="text-gray-300 text-sm">Ottieni più visualizzazioni con l'Happy Hour.</div>
        </div>

      {/* Promuovi il profilo */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-semibold text-white">Promuovi il tuo profilo</div>
            <div className="text-xs text-gray-400">Saldo: {wallet ?? '—'} crediti</div>
          </div>
          <a href="/dashboard/crediti" className="text-sm text-blue-600 underline">Vedi tutti i pacchetti</a>
        </div>
        {catalog.length === 0 ? (
          <div className="text-sm text-gray-400">Nessun pacchetto disponibile al momento.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {catalog.slice(0,3).map(p => {
              const s = tierClasses(p.code);
              return (
                <div key={p.code} className={`relative rounded-2xl border p-4 transition-shadow hover:shadow-xl ${s.card}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 grid place-items-center rounded-full bg-white/80 ${s.ring} ring-2 text-neutral-800`}>
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
        <Button className="bg-blue-600 hover:bg-blue-700">Attiva</Button>
      </div>

      {/* Bot Telegram / Verifica impostazioni */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-600">
          <div className="text-white font-semibold">Ottieni più visualizzazioni con il bot</div>
          <div className="text-gray-300 text-sm">Per verificare le impostazioni di condivisione del tuo contenuto, clicca qui.</div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-10">
              <Image src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" fill className="object-contain" />
            </div>
            <div className="text-sm text-gray-300">Configura il bot Telegram per la tua promozione</div>
          </div>
          <Link href="/dashboard/supporto" className="text-blue-400 hover:underline text-sm">Clicca qui</Link>
        </div>
      </div>

      {/* Lui Cerca */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white">Lui Cerca</div>
            <div className="text-sm text-gray-300">Scopri cosa cercano i clienti!</div>
          </div>
          <Link href="/dashboard/ricerca" className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-semibold">Controlla messaggi</Link>
        </div>
      </div>

      {/* Disponibilità switch */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 grid md:grid-cols-2 gap-4">
        <div className="border border-gray-600 rounded-md p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Disponibile per la prenotazione ora?</div>
            <div className="text-xs text-gray-400">Mostra agli utenti quando puoi ricevere richieste.</div>
          </div>
          <Button variant="secondary" onClick={() => setAvailableBooking(v => !v)}>{availableBooking ? "Disattiva" : "Attiva"}</Button>
        </div>
        <div className="border border-gray-600 rounded-md p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Disponibile per Chat</div>
            <div className="text-xs text-gray-400">Indica se sei online e rispondi rapidamente.</div>
          </div>
          <Button variant="secondary" onClick={() => setAvailableChat(v => !v)}>{availableChat ? "Disabilita" : "Abilita"}</Button>
        </div>
      </div>

      {/* Problemi e Suggerimenti */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="text-sm font-semibold mb-2 text-white">Problemi e Suggerimenti</div>
        <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
          <li>Aggiungi un video al tuo profilo per più visualizzazioni <Link href="/dashboard/escort/compila" className="text-blue-400 hover:underline">Carica</Link></li>
          <li>Attira l'attenzione con una foto in copertina <Link href="/dashboard/escort/compila" className="text-blue-400 hover:underline">Carica</Link></li>
        </ul>
      </div>

      {/* Forum teaser */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-white">Forum Rosa</div>
          <div className="text-sm text-gray-300">Confronti con altre inserzioniste su stile e sicurezza.</div>
        </div>
        <Link href="/dashboard/forum" className="text-white bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-md text-sm font-semibold">Visita Forum</Link>
      </div>

      {/* Promo banner */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-0 overflow-hidden">
        <div className="p-4">
          <div className="text-white font-semibold">1 GIORNO IN PRIMA POSIZIONE IN UNA CITTÀ A TUA SCELTA</div>
          <div className="text-gray-300 text-sm">Aumenta la visibilità del tuo profilo con le promozioni.</div>
        </div>
        <div className="p-4 border-t border-gray-600 flex justify-end">
          <Button className="bg-red-600 hover:bg-red-700">Scopri le offerte</Button>
        </div>
      </div>
    </div>
  );
}
