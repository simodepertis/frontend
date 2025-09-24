"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faStar, faGem, faShieldHalved, faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";

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

      {/* Posizionamento personalizzato (giorni a scelta) */}
      {placementCfg && (
        <div className="rounded-xl border bg-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Posizionamento personalizzato</div>
            <div className="text-xs text-neutral-500">Prezzo: {placementCfg.pricePerDayCredits} crediti/giorno</div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Giorni</label>
              <input type="number" min={placementCfg.minDays} max={placementCfg.maxDays} value={placementDays}
                onChange={(e)=>setPlacementDays(Math.min(Math.max(Number(e.target.value||placementCfg.minDays), placementCfg.minDays), placementCfg.maxDays))}
                className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32" />
              <div className="text-xs text-neutral-500">Range: {placementCfg.minDays}–{placementCfg.maxDays} giorni</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600">Costo</div>
              <div className="font-semibold text-white">{placementCfg.pricePerDayCredits * (placementDays||0)} crediti</div>
            </div>
            <div className="flex md:justify-end">
              <Button onClick={async ()=>{
                const days = placementDays;
                if (!days || days < placementCfg.minDays || days > placementCfg.maxDays) { alert('Numero giorni non valido'); return; }
                try {
                  const res = await fetch('/api/credits/spend-custom', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
                    },
                    body: JSON.stringify({ days })
                  });
                  const data = await res.json();
                  if (!res.ok) { alert(data?.error || 'Errore attivazione posizionamento'); return; }
                  await loadAll();
                  setNotice({ type: 'success', msg: `Posizionamento attivato per ${days} giorni (scade il ${new Date(data?.activated?.expiresAt).toLocaleDateString()})` });
                } catch { alert('Errore attivazione posizionamento'); }
              }}>Attiva personalizzato</Button>
            </div>
          </div>
        </div>
      )}

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
  const [daysByCode, setDaysByCode] = useState<Record<string, number>>({});
  const [spending, setSpending] = useState<string>("");
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const minCredits = 10;
  const [tab, setTab] = useState<'crediti' | 'ordini'>('crediti');
  const [orders, setOrders] = useState<Array<{ id: number; credits: number; method: string; status: string; createdAt: string; receiptUrl?: string; phone?: string }>>([]);
  const [orderForm, setOrderForm] = useState<{ credits: number; method: 'manual_bollettino' | 'manual_bonifico'; phone: string }>({ credits: 10, method: 'manual_bollettino', phone: '' });
  const [orderInstructions, setOrderInstructions] = useState<any | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(null);
  // Custom placement settings and form
  const [placementCfg, setPlacementCfg] = useState<{ pricePerDayCredits: number; minDays: number; maxDays: number } | null>(null);
  const [placementDays, setPlacementDays] = useState<number>(7);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const authHeaders = {
        'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
      };
      
      const [w, c, t, o, s] = await Promise.all([
        fetch('/api/credits/wallet', { headers: authHeaders }),
        fetch('/api/credits/catalog'),
        fetch('/api/credits/transactions', { headers: authHeaders }),
        fetch('/api/credits/orders', { headers: authHeaders }),
        fetch('/api/credits/settings')
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
    } catch (e) {
      console.error('❌ Errore caricamento dati:', e);
    }
  }

  async function buyCredits() {
    const qty = Number(creditsToBuy);
    if (!Number.isFinite(qty) || qty < minCredits) { alert(`Minimo ${minCredits} crediti`); return; }
    // Porta l'utente nella scheda Ordini precompilando i crediti
    setOrderForm((p) => ({ ...p, credits: qty }));
    setOrderInstructions(null);
    setTab('ordini');
  }

  async function spend(code: string) {
    try {
      const res = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
        },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || 'Errore spesa crediti'); return; }
      await loadAll();
      setNotice({ type: 'success', msg: `Tier attivato: ${data?.activated?.tier} fino a ${new Date(data?.activated?.expiresAt).toLocaleDateString()}` });
    } catch (e) { alert('Errore spesa crediti'); }
  }

  const sortedTx = useMemo(() => tx.slice().sort((a,b) => a.id < b.id ? 1 : -1), [tx]);

  const tierIcon = (code: string) => {
    if (code.startsWith('VIP')) return faCrown;
    if (code.startsWith('TITANIO')) return faShieldHalved;
    if (code.startsWith('ORO')) return faStar;
    if (code.startsWith('ARGENTO')) return faGem;
    return faStar;
  };

  const tierClasses = (code: string) => {
    // Ripristino stile precedente: card chiare per ciascun tier
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
      {/* Hero saldo + acquisto */}
      <div className="rounded-xl border bg-gray-800 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-600">Saldo attuale</div>
          <div className="text-4xl font-extrabold">{balance} crediti</div>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={minCredits} value={creditsToBuy} onChange={(e) => setCreditsToBuy(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <Button onClick={buyCredits} className="h-10">Procedi al pagamento</Button>
        </div>
      </div>

      {/* Catalogo posizionamenti */}
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
