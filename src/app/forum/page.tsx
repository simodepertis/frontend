"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ThreadItem = { id: number; title: string; createdAt: string; author: { id: number; nome: string } };

export default function ForumPublicPage() {
  const cats = [
    { k: 'citta', t: 'Città', d: 'Milano, Roma, Napoli, Firenze, Bologna…' },
    { k: 'esperienze', t: 'Esperienze', d: 'Racconti e consigli' },
    { k: 'eventi', t: 'Eventi', d: 'Serate, inaugurazioni, tour' },
    { k: 'servizi', t: 'Servizi', d: 'Foto/Video, location, wellness' },
  ];
  const rules = [
    'Rispetta la privacy e non pubblicare dati sensibili',
    'Evita spam e link malevoli',
    'Segnala contenuti non appropriati allo staff',
  ];
  const [recent, setRecent] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async()=>{
      try {
        const res = await fetch('/api/forum/threads?limit=10', { cache: 'no-store' });
        const j = await res.json();
        if (res.ok) setRecent((j.items||[]).map((x:any)=>({ id:x.id, title:x.title, createdAt:x.createdAt, author:x.author })));
      } finally { setLoading(false); }
    })();
  }, []);
  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Forum</h1>
        <p className="text-gray-300 mt-2">Regole, categorie e accesso all'area di supporto.</p>
      </div>

      {/* Regole */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-2">Regole</div>
        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
          {rules.map((r,i)=>(<li key={i}>{r}</li>))}
        </ul>
      </div>

      {/* Macro categorie */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-2">Categorie principali</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cats.map(c => (
            <div key={c.k} className="rounded-md border border-gray-600 bg-gray-900 p-4">
              <div className="text-white font-semibold">{c.t}</div>
              <div className="text-xs text-gray-400">{c.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Discussioni recenti */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-2">Discussioni recenti</div>
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : recent.length === 0 ? (
          <div className="text-sm text-gray-400">Ancora nessuna discussione</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {recent.map(t => (
              <div key={t.id} className="py-2 flex items-center justify-between">
                <div className="text-gray-300">
                  <Link href={`/forum/${t.id}`} className="text-blue-400 hover:underline">{t.title}</Link>
                  <span className="text-xs text-gray-500 ml-2">di {t.author?.nome || 'Utente'} · {new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                <Link href={`/forum/${t.id}#reply`} className="text-xs text-blue-400 hover:underline">Apri</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center">
        <div className="text-white font-semibold mb-2">Hai bisogno di assistenza?</div>
        <div className="text-gray-400 mb-3">Apri un ticket dal tuo dashboard</div>
        <Link href="/dashboard/supporto" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Vai al Supporto</Link>
      </div>
    </main>
  );
}
