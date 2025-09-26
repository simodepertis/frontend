"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PiccoliAnnunciPage() {
  const [hasAccess, setHasAccess] = useState(false);
  const [creatingPayPal, setCreatingPayPal] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; title: string; city: string; price: string; description: string; photos: string[] }>>([]);

  useEffect(() => {
    try { setHasAccess(localStorage.getItem('apt-ads-access') === '1'); } catch {}
    try { const raw = localStorage.getItem('apt-ads'); if (raw) setItems(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem('apt-ads', JSON.stringify(items)); } catch {} }, [items]);

  async function buyAccess() {
    setCreatingPayPal(true);
    try {
      const res = await fetch('/api/annunci/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}` },
        body: JSON.stringify({ product: 'APARTMENT_AD_ACCESS' })
      });
      const data = await res.json();
      if (!res.ok || !data?.approvalUrl) { alert(data?.error || 'Errore PayPal'); return; }
      window.location.href = data.approvalUrl;
    } finally { setCreatingPayPal(false); }
  }

  function addItem() {
    const id = `${Date.now()}`;
    setItems((arr) => [{ id, title: '', city: '', price: '', description: '', photos: [] }, ...arr]);
  }
  function removeItem(id: string) { setItems((arr)=> arr.filter(i=> i.id !== id)); }

  return (
    <div className="space-y-6">
      <SectionHeader title="Affitti Appartamenti / B&B" subtitle="Inserisci un annuncio di affitto. Accesso riservato a chi paga l’attivazione." />

      {!hasAccess ? (
        <div className="rounded-xl border bg-gray-800 p-5 space-y-3">
          <div className="text-white font-semibold">Attiva l’accesso</div>
          <p className="text-sm text-gray-300">Per creare e gestire i tuoi annunci appartamento/B&B è necessaria un’attivazione una tantum. Il pagamento avviene con PayPal.</p>
          <div>
            <Button onClick={buyAccess} disabled={creatingPayPal}>{creatingPayPal ? 'Reindirizzo…' : 'Paga con PayPal'}</Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">I tuoi annunci</div>
            <Button onClick={addItem}>+ Nuovo annuncio</Button>
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-gray-400">Nessun annuncio creato.</div>
          ) : (
            <div className="space-y-4">
              {items.map((it, idx) => (
                <div key={it.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <input value={it.title} onChange={(e)=> setItems(a=> a.map(x=> x.id===it.id? { ...x, title: e.target.value }: x))} placeholder="Titolo" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
                    <input value={it.city} onChange={(e)=> setItems(a=> a.map(x=> x.id===it.id? { ...x, city: e.target.value }: x))} placeholder="Città" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
                    <input value={it.price} onChange={(e)=> setItems(a=> a.map(x=> x.id===it.id? { ...x, price: e.target.value }: x))} placeholder="Prezzo a notte / mese" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
                  </div>
                  <textarea value={it.description} onChange={(e)=> setItems(a=> a.map(x=> x.id===it.id? { ...x, description: e.target.value }: x))} placeholder="Descrizione" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 min-h-[100px]" />
                  <input value={(it.photos[0]||'')} onChange={(e)=> setItems(a=> a.map(x=> x.id===it.id? { ...x, photos: [e.target.value] }: x))} placeholder="URL Foto (opzionale)" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-full" />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">Non pubblici. Solo tu vedi e gestisci i tuoi annunci qui.</div>
                    <Button variant="secondary" onClick={()=> removeItem(it.id)}>Elimina</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
