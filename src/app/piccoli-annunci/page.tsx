"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import ITALIAN_CITIES from "@/lib/cities";

type Ad = { id: number; title: string; body: string; city: string; phone?: string; email?: string; img?: string; category: string };

export default function PiccoliAnnunciPage() {
  const [cat, setCat] = useState("");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");

  const categories = [
    { k: 'eventi', t: 'Eventi' },
    { k: 'collab', t: 'Collaborazioni' },
    { k: 'servizi', t: 'Servizi' },
    { k: 'varie', t: 'Varie' },
  ];

  const ads: Ad[] = useMemo(() => ([
    { id: 1, title: 'Bella casalinga, milf porcellina…', body: 'Sono una bella milf… zona Alessandria…', city: 'Alessandria', phone: '351990305', email: 'Scrivimi', img: '/placeholder.svg', category: 'servizi' },
    { id: 2, title: 'BELLA MILF (VEDI FOTO)…', body: 'Sempre eccitata e sempre con voglia…', city: 'Roma', phone: '3286526103', email: 'Scrivimi', img: '/placeholder.svg', category: 'eventi' },
  ]), []);

  const filtered = ads.filter(a =>
    (!cat || a.category === cat) && (!city || a.city === city) && (!q || a.title.toLowerCase().includes(q.toLowerCase()) || a.body.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Piccoli Annunci</h1>
        <Link href="#" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Pubblica annuncio</Link>
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6 grid md:grid-cols-3 gap-3">
        <select value={cat} onChange={e=>setCat(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
          <option value="">Categoria</option>
          {categories.map(c => <option key={c.k} value={c.k}>{c.t}</option>)}
        </select>
        <select value={city} onChange={e=>setCity(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
          <option value="">Città</option>
          {ITALIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ricerca per testo libero" className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <button className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md">Cerca</button>
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {filtered.map(a => (
          <article key={a.id} className="rounded-xl border border-gray-700 bg-gray-800 overflow-hidden">
            <div className="grid md:grid-cols-[240px_1fr] gap-0">
              <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
                <Image src={a.img || '/placeholder.svg'} alt={a.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h2 className="text-white font-semibold mb-1 line-clamp-2">{a.title}</h2>
                <div className="text-sm text-gray-300 line-clamp-3 md:line-clamp-2">{a.body}</div>
                <div className="mt-3 grid sm:grid-cols-3 gap-2">
                  <div className="rounded-lg border border-gray-600 bg-gray-900 p-3">
                    <div className="text-xs text-gray-400">Localizzazione</div>
                    <div className="text-sm text-white">{a.city}</div>
                  </div>
                  <div className="rounded-lg border border-gray-600 bg-gray-900 p-3">
                    <div className="text-xs text-gray-400">Telefono</div>
                    <div className="text-sm text-white">{a.phone || '—'}</div>
                  </div>
                  <div className="rounded-lg border border-gray-600 bg-gray-900 p-3">
                    <div className="text-xs text-gray-400">E-mail</div>
                    <div className="text-sm text-blue-300">{a.email || '—'}</div>
                  </div>
                </div>
                <div className="mt-3 text-right">
                  <button className="text-blue-400 text-sm">Mostra di più</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
