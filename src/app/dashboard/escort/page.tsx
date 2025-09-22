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
        const authHeaders = {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        };
        
        const [w, c] = await Promise.all([
          fetch('/api/credits/wallet', { headers: authHeaders }),
          fetch('/api/credits/catalog'),
        ]);
        
        if (w.ok) { 
          const { wallet } = await w.json(); 
          setWallet(wallet?.balance ?? 0); 
          console.log(`💰 Saldo attuale: ${wallet?.balance} crediti`);
        } else {
          console.error('❌ Errore caricamento wallet:', await w.text());
        }
        
        if (c.ok) { 
          const { products } = await c.json(); 
          setCatalog(products || []); 
          console.log(`📦 Caricati ${products?.length || 0} pacchetti`);
        } else {
          console.error('❌ Errore caricamento catalogo:', await c.text());
        }
      } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
      }
    })();
  }, []);

  async function spend(code: string) {
    setSpending(code);
    try {
      console.log(`💳 Tentativo attivazione pacchetto: ${code}`);
      
      const res = await fetch('/api/credits/spend', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        }, 
        body: JSON.stringify({ code }) 
      });
      
      const data = await res.json();
      console.log('📦 Risposta API spend:', data);
      
      if (!res.ok) { 
        const errorMsg = data?.error || 'Errore durante l\'attivazione';
        alert(errorMsg);
        console.error('❌ Errore attivazione:', errorMsg);
        return; 
      }
      
      // reload wallet
      try { 
        const w = await fetch('/api/credits/wallet', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}` }
        }); 
        if (w.ok) { 
          const { wallet } = await w.json(); 
          setWallet(wallet?.balance ?? 0); 
          console.log(`💰 Nuovo saldo: ${wallet?.balance} crediti`);
        } 
      } catch {}
      
      const successMsg = `✅ Pacchetto ${data?.activated?.tier} attivato fino al ${new Date(data?.activated?.expiresAt).toLocaleDateString()}!`;
      alert(successMsg);
      console.log(successMsg);
      
      // Refresh della pagina per vedere il profilo aggiornato
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error) {
      console.error('❌ Errore durante attivazione:', error);
      alert('Errore di connessione. Riprova.');
    } finally { 
      setSpending(""); 
    }
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
        <Button className="bg-blue-600 hover:bg-blue-700">Attiva</Button>
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
                    <div className={`w-9 h-9 grid place-items-center rounded-full bg-gray-700 ${s.ring} ring-2 text-white`}>
                      <FontAwesomeIcon icon={tierIcon(p.code)} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{p.label}</div>
                      <div className="text-[11px] text-gray-400">Durata {p.durationDays} giorni</div>
                    </div>
                    <span className={`ml-auto text-[10px] px-2 py-1 rounded-full ${s.pill}`}>{p.code.split('_')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <div className="text-gray-400">Costo</div>
                      <div className="font-semibold text-white">{p.creditsCost} crediti</div>
                    </div>
                    <Button onClick={() => spend(p.code)} disabled={spending === p.code} className={`px-4 ${s.cta}`}>{spending === p.code ? 'Attivazione…' : 'Attiva'}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
