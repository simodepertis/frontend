"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import EscortPicker from "@/components/EscortPicker";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faStar, faGem, faShieldHalved, faCircleCheck, faCircleExclamation, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import PayPalButton from "@/components/PayPalButton";

function Copy({ text, label }: { text: string; label?: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="text-xs px-2 py-1 border border-gray-600 bg-gray-700 text-white rounded-md hover:bg-gray-600"
      title="Copia negli appunti"
    >{label || 'Copia'}</button>
  );
}

function Row({ k, v, copy }: { k: string; v: string; copy?: boolean }) {
  return (
    <div className="grid grid-cols-[140px,1fr,auto] items-center gap-2 py-1">
      <div className="text-gray-400 text-xs md:text-sm">{k}</div>
      <div className="font-medium text-xs md:text-sm break-all text-white">{v}</div>
      {copy && <Copy text={v} />}
    </div>
  );
}

function PaymentInstructions({ instructions, order }: { instructions: any; order: { credits: number; method: string; phone: string } }) {
  const metodo = String(order.method || instructions?.tipo || '').includes('bonifico') ? 'Bonifico bancario' : 'Bollettino postale';
  const iban = instructions?.iban || instructions?.IBAN || '';
  const intestatario = instructions?.intestatario || instructions?.beneficiario || '';
  const banca = instructions?.banca || instructions?.istituto || '';
  const causale = instructions?.causale || `Acquisto crediti – Tel: ${order.phone || '—'}`;
  
  // Calcolo prezzo in euro (€0.50 per credito)
  const prezzoCreditoEuro = 0.50;
  const prezzoTotaleEuro = order.credits * prezzoCreditoEuro;

  return (
    <div className="rounded-xl border bg-gray-800 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">Istruzioni di pagamento</div>
          <div className="text-lg font-semibold text-white">{metodo}</div>
        </div>
        <div className="text-sm text-gray-400">
          <div>Importo: <span className="font-semibold text-lg text-green-400">€{prezzoTotaleEuro.toFixed(2)}</span></div>
          <div className="text-xs text-gray-500">({order.credits} crediti × €{prezzoCreditoEuro.toFixed(2)})</div>
        </div>
      </div>

      <div className="mt-4 divide-y">
        {metodo === 'Bonifico bancario' ? (
          <div className="py-2">
            <Row k="Intestatario" v={intestatario} />
            {banca && <Row k="Banca" v={banca} />}
            {iban && (
              <div className="grid grid-cols-[140px,1fr,auto] items-center gap-2 py-1">
                <div className="text-neutral-600 text-xs md:text-sm">IBAN</div>
                <div className="font-mono text-xs md:text-sm tracking-wide">{iban}</div>
                <Copy text={iban} />
              </div>
            )}
            <Row k="Causale" v={causale} copy />
          </div>
        ) : (
          <div className="py-2">
            <Row k="Intestatario" v={intestatario || '—'} />
            <Row k="Ufficio Postale" v={banca || 'Qualsiasi ufficio abilitato'} />
            <Row k="Causale" v={causale} copy />
          </div>
        )}
      </div>

      {/* Se necessario, la sezione posizionamento personalizzato verrà mostrata altrove nella pagina crediti */}

      <div className="mt-4 p-3 rounded-md bg-gray-700 border border-gray-600 text-xs text-gray-300">
        - Conserva la ricevuta in formato immagine o PDF.\n
        - Dopo il versamento, carica la ricevuta nella sezione "I miei ordini" qui sotto.\n
        - L'accredito dei crediti avviene dopo la verifica (in orari d'ufficio).
      </div>
    </div>
  );
}

export default function CreditiPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<Array<{ id: number; amount: number; type: string; reference?: string; createdAt: string }>>([]);
  const [creditsToBuy, setCreditsToBuy] = useState(10);
  const [catalog, setCatalog] = useState<Array<{ code: string; label: string; creditsCost: number; durationDays: number; pricePerDayCredits?: number|null; minDays?: number|null; maxDays?: number|null }>>([]);
  const [escortUserId, setEscortUserId] = useState<number>(0);
  const [actingPlacement, setActingPlacement] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showPayPal, setShowPayPal] = useState(false);
  const minCredits = 10;
  const [tab, setTab] = useState<'crediti' | 'ordini'>('crediti');
  const [orders, setOrders] = useState<Array<{ id: number; credits: number; method: string; status: string; createdAt: string; receiptUrl?: string; phone?: string }>>([]);
  const [orderForm, setOrderForm] = useState<{ credits: number; method: 'manual_bollettino' | 'manual_bonifico'; phone: string }>({ credits: 10, method: 'manual_bollettino', phone: '' });
  const [orderInstructions, setOrderInstructions] = useState<any | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<number | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [creatingPayPal, setCreatingPayPal] = useState(false);
  const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(null);
  // Custom placement settings and form
  const [placementCfg, setPlacementCfg] = useState<{ pricePerDayCredits: number; minDays: number; maxDays: number } | null>(null);
  const [placementDays, setPlacementDays] = useState<number>(7);
  // Placement stato corrente dal profilo (contacts.placement)
  const [placement, setPlacement] = useState<null | { code: string; status: 'ACTIVE'|'PAUSED'; startedAt?: string; lastStartAt?: string; lastPauseAt?: string; remainingDays?: number }>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [daysByCode, setDaysByCode] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const authHeaders = {
        'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
      };
      
      const [w, c, t, o, s, me] = await Promise.all([
        escortUserId ? fetch(`/api/agency/credits/wallet?escortUserId=${escortUserId}`, { headers: authHeaders }) : fetch('/api/credits/wallet', { headers: authHeaders }),
        fetch('/api/credits/catalog'),
        fetch('/api/credits/transactions', { headers: authHeaders }),
        fetch('/api/credits/orders', { headers: authHeaders }),
        fetch('/api/credits/settings'),
        fetch('/api/profile/me', { headers: authHeaders }),
      ]);
      
      if (w.ok) { 
        const { wallet } = await w.json(); 
        setBalance(wallet?.balance ?? 0); 
        console.log(`💰 Saldo caricato: ${wallet?.balance} crediti`);
      } else {
        console.error('❌ Errore caricamento wallet:', await w.text());
      }
      
      if (c.ok) { 
        const { products } = await c.json(); 
        setCatalog(products || []); 
        console.log(`📦 Caricati ${products?.length || 0} prodotti`);
      } else {
        console.error('❌ Errore caricamento catalogo:', await c.text());
      }
      
      if (t.ok) { 
        const { transactions } = await t.json(); 
        setTx(transactions || []); 
        console.log(`📊 Caricate ${transactions?.length || 0} transazioni`);
      } else {
        console.error('❌ Errore caricamento transazioni:', await t.text());
      }
      
      if (o.ok) { 
        const { orders } = await o.json(); 
        setOrders(orders || []); 
        console.log(`🛒 Caricati ${orders?.length || 0} ordini`);
      } else {
        console.error('❌ Errore caricamento ordini:', await o.text());
      }
      // Load custom placement settings
      try {
        const s = await fetch('/api/credits/settings');
        if (s.ok) {
          const j = await s.json();
          const p = j?.placement;
          if (p) {
            setPlacementCfg(p);
            setPlacementDays(Math.min(Math.max(p.minDays, placementDays || p.minDays), p.maxDays));
          }
        }
      } catch {}

      // Load placement from profile and user role
      try {
        if (me.ok) {
          const jm = await me.json();
          const plc = jm?.profile?.contacts?.placement || null;
          setPlacement(plc ? {
            code: plc.code,
            status: plc.status,
            startedAt: plc.startedAt,
            lastStartAt: plc.lastStartAt,
            lastPauseAt: plc.lastPauseAt,
            remainingDays: plc.remainingDays,
          } : null);
          // Salva il ruolo utente per nascondere EscortPicker se è escort
          setUserRole(jm?.user?.ruolo || '');
        }
      } catch {}
    } catch (e) {
      console.error('❌ Errore caricamento dati:', e);
    }
  }

  async function buyCredits() {
    const qty = Number(creditsToBuy);
    if (!Number.isFinite(qty) || qty < minCredits) { alert(`Minimo ${minCredits} crediti`); return; }
    // Mostra opzioni di pagamento
    setShowPayPal(true);
  }

  const handlePayPalSuccess = async (details: any) => {
    setShowPayPal(false);
    await loadAll();
    setNotice({ type: 'success', msg: `Pagamento completato! Accreditati ${details.credits} crediti. Nuovo saldo: ${details.newBalance}` });
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal error:', error);
    setNotice({ type: 'error', msg: 'Errore durante il pagamento PayPal. Riprova.' });
  };

  const handlePayPalCancel = () => {
    setNotice({ type: 'error', msg: 'Pagamento PayPal annullato.' });
  };

  async function spend(code: string) {
    try {
      const url = escortUserId ? '/api/agency/credits/spend' : '/api/credits/spend';
      const body = escortUserId ? { escortUserId, code } : { code };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || 'Errore spesa crediti'); return; }
      await loadAll();
      setNotice({ type: 'success', msg: `Tier attivato: ${data?.activated?.tier} fino a ${new Date(data?.activated?.expiresAt).toLocaleDateString()}` });
    } catch (e) { alert('Errore spesa crediti'); }
  }

  const sortedTx = useMemo(() => tx.slice().sort((a,b) => a.id < b.id ? 1 : -1), [tx]);

  const tierIcon = (code: string) => {
    if (code.startsWith('GIRL')) return faWandMagicSparkles;
    if (code.startsWith('VIP')) return faCrown;
    if (code.startsWith('TITANIO')) return faShieldHalved;
    if (code.startsWith('ORO')) return faStar;
    if (code.startsWith('ARGENTO')) return faGem;
    return faStar;
  };

  const tierClasses = (code: string) => {
    // Ripristino stile precedente: card chiare per ciascun tier
    if (code.startsWith('GIRL')) {
      return {
        card: 'bg-gradient-to-br from-pink-50 to-rose-100 border-rose-200 hover:shadow-rose-200/60',
        pill: 'bg-rose-500 text-white',
        cta: 'bg-rose-600 hover:bg-rose-700 text-white',
        ring: 'ring-rose-400'
      };
    }
    if (code.startsWith('VIP')) {
      return {
        card: 'bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200 hover:shadow-amber-200/60',
        pill: 'bg-yellow-400 text-black',
        cta: 'bg-yellow-500 hover:bg-yellow-600 text-black',
        ring: 'ring-yellow-400'
      };
    }
    if (code.startsWith('TITANIO')) {
      return {
        card: 'bg-gradient-to-br from-sky-50 to-blue-100 border-blue-200 hover:shadow-blue-200/60',
        pill: 'bg-sky-700 text-white',
        cta: 'bg-sky-700 hover:bg-sky-800 text-white',
        ring: 'ring-sky-500'
      };
    }
    if (code.startsWith('ORO')) {
      return {
        card: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 hover:shadow-amber-200/60',
        pill: 'bg-amber-300 text-black',
        cta: 'bg-amber-400 hover:bg-amber-500 text-black',
        ring: 'ring-amber-400'
      };
    }
    if (code.startsWith('ARGENTO')) {
      return {
        card: 'bg-gradient-to-br from-zinc-50 to-gray-100 border-gray-200 hover:shadow-gray-200/60',
        pill: 'bg-zinc-300 text-neutral-900',
        cta: 'bg-zinc-700 hover:bg-zinc-800 text-white',
        ring: 'ring-zinc-400'
      };
    }
    return {
      card: 'bg-gray-800 border-neutral-200',
      pill: 'bg-neutral-200 text-neutral-800',
      cta: 'bg-neutral-900 hover:bg-black text-white',
      ring: 'ring-neutral-300'
    };
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Crediti" subtitle="Saldo, posizionamenti e storico movimenti" />

      {/* Selezione Escort (solo per Agenzia) */}
      {userRole === 'agenzia' && (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
          <EscortPicker value={escortUserId} onChange={(v)=>{ setEscortUserId(v); setLoading(true); }} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setTab('crediti')} className={`px-3 py-1.5 rounded-md text-sm ${tab==='crediti' ? 'bg-neutral-900 text-white' : 'bg-gray-800 border'}`}>Crediti</button>
        <button onClick={() => setTab('ordini')} className={`px-3 py-1.5 rounded-md text-sm ${tab==='ordini' ? 'bg-neutral-900 text-white' : 'bg-gray-800 border'}`}>Ordini</button>
      </div>

      {notice && (
        <div className={`rounded-md p-3 text-sm flex items-center gap-2 ${notice.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <FontAwesomeIcon icon={notice.type === 'success' ? faCircleCheck : faCircleExclamation} />
          <span>{notice.msg}</span>
          <button className="ml-auto text-xs underline" onClick={() => setNotice(null)}>chiudi</button>
        </div>
      )}

      {tab === 'crediti' && (
      <>
      {/* Stato posizionamento attuale con pausa/ripresa (SOLO escort/agenzia) */}
      {userRole !== 'user' && (
      <div className="rounded-xl border bg-gray-800 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Stato posizionamento</div>
          {placement ? (
            <span className={`text-xs px-2 py-1 rounded-full ${placement.status==='ACTIVE' ? 'bg-green-600 text-green-100' : 'bg-amber-600 text-amber-100'}`}>
              {placement.status==='ACTIVE' ? 'Attivo' : 'In pausa'}
            </span>
          ) : (
            <span className="text-xs text-neutral-500">Nessun posizionamento attivo</span>
          )}
        </div>
        {placement && (
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-300">
            {typeof placement.remainingDays === 'number' && (
              <div>Giorni residui: <span className="font-semibold text-white">{placement.remainingDays}</span></div>
            )}
            {(() => {
              try {
                // Calcolo scadenza stimata: oggi + giorni residui
                // La pausa estende la scadenza perché i giorni residui non calano da PAUSED
                if (typeof placement?.remainingDays === 'number') {
                  const base = new Date();
                  const d = new Date(base.getTime());
                  d.setDate(d.getDate() + Math.max(0, placement.remainingDays));
                  return <div>Scadenza stimata: <span className="font-semibold text-white">{d.toLocaleDateString()}</span></div>;
                }
              } catch {}
              return null;
            })()}
            {placement.lastStartAt && <div>Ripreso: {new Date(placement.lastStartAt).toLocaleDateString()}</div>}
            {placement.lastPauseAt && <div>Pausa: {new Date(placement.lastPauseAt).toLocaleDateString()}</div>}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={actingPlacement==='pause' || placement.status!=='ACTIVE'}
                onClick={async()=>{
                  setActingPlacement('pause');
                  try {
                    const res = await fetch('/api/credits/placement', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}` }, body: JSON.stringify({ action: 'pause' }) });
                    const j = await res.json().catch(()=>({}));
                    if (!res.ok) { alert(j?.error || 'Errore pausa'); return; }
                    await loadAll();
                  } finally { setActingPlacement(null); }
                }}>Metti in pausa</Button>
              <Button
                disabled={actingPlacement==='resume' || placement.status!=='PAUSED'}
                onClick={async()=>{
                  setActingPlacement('resume');
                  try {
                    const res = await fetch('/api/credits/placement', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}` }, body: JSON.stringify({ action: 'resume' }) });
                    const j = await res.json().catch(()=>({}));
                    if (!res.ok) { alert(j?.error || 'Errore ripresa'); return; }
                    await loadAll();
                  } finally { setActingPlacement(null); }
                }}>Riprendi</Button>
            </div>
          </div>
        )}
      </div>
      {/* Hero saldo + acquisto */}
      <div className="rounded-xl border bg-gray-800 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-600">Saldo attuale</div>
          <div className="text-4xl font-extrabold">{balance} crediti</div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input type="number" min={minCredits} value={creditsToBuy} onChange={(e) => setCreditsToBuy(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Button onClick={buyCredits} className="h-10">Procedi al pagamento</Button>
          </div>
          {showPayPal && (
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="text-sm text-gray-300 mb-3">
                Acquisto {creditsToBuy} crediti - €{(creditsToBuy * 0.50).toFixed(2)}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <PayPalButton
                    credits={creditsToBuy}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                    onCancel={handlePayPalCancel}
                  />
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowPayPal(false)}
                  className="px-3"
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Catalogo posizionamenti (SOLO escort/agenzia) */}
      {userRole !== 'user' && (
      <div className="rounded-xl border bg-gray-800 p-5">
        <div className="font-semibold mb-3">Acquista posizionamenti</div>
        {catalog.length === 0 ? (
          <div className="text-sm text-neutral-500">Catalogo non disponibile</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {catalog.map(p => {
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
                    <div className={`w-10 h-10 grid place-items-center rounded-full bg-gray-800/80 ${s.ring} ring-2 text-neutral-800`}>
                      <FontAwesomeIcon icon={tierIcon(p.code)} />
                    </div>
                    <div>
                      <div className="font-extrabold text-lg text-neutral-900">{p.label}</div>
                    </div>
                    <span className={`ml-auto text-[11px] px-2 py-1 rounded-full ${s.pill}`}>{p.code.split('_')[0]}</span>
                  </div>
                  {p.pricePerDayCredits ? (
                    <div className="mt-2 grid grid-cols-[1fr,auto,auto] items-end gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-neutral-600">Giorni</label>
                        <input
                          type="number"
                          min={p.minDays || 1}
                          max={p.maxDays || 60}
                          value={daysByCode[p.code] ?? (p.minDays || 1)}
                          onChange={(e)=>setDaysByCode(d=>({ ...d, [p.code]: Math.min(Math.max(Number(e.target.value|| (p.minDays||1)), p.minDays||1), p.maxDays||60) }))}
                          className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="text-xs text-neutral-500">Range: {p.minDays || 1}–{p.maxDays || 60} giorni</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-neutral-700">Costo</div>
                        <div className="font-semibold text-neutral-900">{(p.pricePerDayCredits||0) * (daysByCode[p.code] ?? (p.minDays||1))} crediti</div>
                      </div>
                      <Button onClick={async()=>{
                        const days = daysByCode[p.code] ?? (p.minDays || 1);
                        try {
                          const res = await fetch('/api/credits/spend-by-product', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
                            },
                            body: JSON.stringify({ code: p.code, days })
                          });
                          const data = await res.json();
                          if (!res.ok) { alert(data?.error || 'Errore attivazione'); return; }
                          await loadAll();
                          setNotice({ type: 'success', msg: `Pacchetto ${p.code} attivato per ${days} giorni (scade il ${new Date(data?.activated?.expiresAt).toLocaleDateString()})` });
                        } catch { alert('Errore attivazione'); }
                      }} className={`px-4 ${s.cta}`}>Attiva</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="text-neutral-700">Costo</div>
                        <div className="font-semibold text-neutral-900">{p.creditsCost} crediti</div>
                      </div>
                      <Button onClick={() => spend(p.code)} className={`px-4 ${s.cta}`}>Attiva</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Storico */}
      <div className="rounded-xl border bg-gray-800 p-5">
        <div className="font-semibold mb-3">Ultime transazioni</div>
        {sortedTx.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessuna transazione</div>
        ) : (
          <div className="space-y-2">
            {sortedTx.map(r => (
              <div key={r.id} className="border rounded-md p-2 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.type}</div>
                  {r.reference && <div className="text-xs text-neutral-600">{r.reference}</div>}
                </div>
                <div className={r.amount >= 0 ? 'text-green-700' : 'text-red-700'}>{r.amount >= 0 ? `+${r.amount}` : r.amount}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {tab === 'ordini' && (
      <>
        {/* Crea ordine manuale */}
        <div className="rounded-xl border bg-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Crea nuovo ordine</div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-700">€{(orderForm.credits * 0.50).toFixed(2)}</div>
              <div className="text-xs text-neutral-500">{orderForm.credits} crediti × €0.50</div>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Crediti</label>
              <input type="number" min={10} value={orderForm.credits} onChange={(e)=>setOrderForm(p=>({...p, credits: Number(e.target.value)}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Metodo</label>
              <select className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={orderForm.method} onChange={(e)=>setOrderForm(p=>({...p, method: e.target.value as any}))}>
                <option value="manual_bollettino">Bollettino Postale</option>
                <option value="manual_bonifico">Bonifico Istantaneo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Telefono (in causale)</label>
              <input value={orderForm.phone} onChange={(e)=>setOrderForm(p=>({...p, phone: e.target.value}))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="es. 333 333 3333" />
            </div>
            <div className="flex items-end">
              <Button onClick={async ()=>{
                setCreatingOrder(true);
                try {
                  const res = await fetch('/api/credits/purchase', { 
                    method: 'POST', 
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
                    }, 
                    body: JSON.stringify(orderForm) 
                  });
                  const data = await res.json();
                  if (!res.ok) { alert(data?.error || 'Errore creazione ordine'); return; }
                  setOrderInstructions(data.istruzioni || null);
                  await loadAll();
                } finally { setCreatingOrder(false); }
              }} disabled={creatingOrder}>{creatingOrder ? 'Creazione…' : 'Crea ordine'}</Button>
            </div>
          </div>

          {orderInstructions && (
            <PaymentInstructions instructions={orderInstructions} order={orderForm} />
          )}
        </div>

        {/* Elenco ordini + upload ricevuta */}
        <div className="rounded-xl border bg-gray-800 p-5">
          <div className="font-semibold mb-3">I miei ordini</div>
          {orders.length === 0 ? (
            <div className="text-sm text-neutral-500">Nessun ordine</div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Ordine #{o.id} · {o.method}</div>
                      <div className="text-xs text-neutral-600">
                        €{(o.credits * 0.50).toFixed(2)} ({o.credits} crediti) · Stato: {o.status}
                      </div>
                      {o.receiptUrl && <a className="text-xs text-blue-600 underline" href={o.receiptUrl} target="_blank">Vedi ricevuta</a>}
                    </div>
                    {o.status === 'PENDING' && (
                      <form className="flex items-center gap-2" onSubmit={async (e)=>{
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget as HTMLFormElement);
                        fd.set('orderId', String(o.id));
                        setUploadingOrderId(o.id);
                        try {
                          const res = await fetch('/api/credits/orders/receipt', { method: 'POST', body: fd });
                          const data = await res.json();
                          if (!res.ok) { alert(data?.error || 'Errore upload'); return; }
                          setNotice({ type: 'success', msg: 'Ricevuta caricata. Crediti accreditati (preview).' });
                          await loadAll();
                        } finally { setUploadingOrderId(null); }
                      }}>
                        <input name="phone" placeholder="Telefono in causale" className="bg-gray-700 border border-gray-600 text-white rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue={o.phone || ''} />
                        <input name="file" type="file" accept="image/*" className="text-xs text-white" required />
                        <Button type="submit" className="h-8" disabled={uploadingOrderId===o.id}>{uploadingOrderId===o.id ? 'Carico…' : 'Carica ricevuta'}</Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
      )}
    </div>
  );
}
