"use client";

import Link from "next/link";

export default function PiccoliAnnunciPage() {
  const cats = [
    { k: 'eventi', t: 'Eventi', d: 'Serate, inaugurazioni, feste private' },
    { k: 'lavoro', t: 'Collaborazioni', d: 'Agenzie, foto/video, content creator' },
    { k: 'servizi', t: 'Servizi', d: 'Makeup, wellness, massaggi, location' },
    { k: 'varie', t: 'Varie', d: 'Oggetti, vetrine, comunicazioni' },
  ];
  const rules = [
    'Niente contenuti illegali o vietati dalla legge',
    'Niente dati sensibili (IBAN, documenti) pubblici',
    'Usa un linguaggio rispettoso',
    'Annunci duplicati o spam verranno rimossi',
  ];
  const list = [
    { id: 1, cat: 'eventi', title: 'Apertura nuova location Milano', body: 'Sala privata zona Porta Romana' },
    { id: 2, cat: 'servizi', title: 'Fotografo professionista', body: 'Shooting in studio e on location' },
  ];
  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Piccoli Annunci</h1>
        <p className="text-gray-300 mt-2">Bacheca annunci e comunicazioni utili alla community.</p>
      </div>

      {/* Categorie */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cats.map(c => (
            <div key={c.k} className="rounded-md border border-gray-600 bg-gray-900 p-4">
              <div className="text-white font-semibold">{c.t}</div>
              <div className="text-xs text-gray-400">{c.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Regole */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-2">Regole di pubblicazione</div>
        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
          {rules.map((r,i)=>(<li key={i}>{r}</li>))}
        </ul>
      </div>

      {/* Elenco annunci (placeholder) */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-3">Annunci recenti</div>
        <div className="space-y-3">
          {list.map(i => (
            <div key={i.id} className="border border-gray-600 rounded-md p-3 bg-gray-900">
              <div className="text-sm text-white">{i.title}</div>
              <div className="text-xs text-gray-400">{i.body}</div>
              <div className="text-[10px] text-blue-300 mt-1">Categoria: {i.cat}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center">
        <div className="text-white font-semibold mb-2">Prossimamente sarà possibile pubblicare</div>
        <div className="text-gray-400 mb-3">Stiamo completando la moderazione e il flusso di invio</div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/nuove-escort" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Vedi novità</Link>
          <Link href="/ricerca-citta" className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold">Ricerca per città</Link>
        </div>
      </div>
    </main>
  );
}
