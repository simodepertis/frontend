"use client";

import SectionHeader from "@/components/SectionHeader";
import Link from "next/link";
import { useEffect, useState } from "react";

type ThreadItem = {
  id: number;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  author: { id: number; nome: string };
  _count?: { posts: number };
};

export default function ForumPage() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("citta");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/forum/threads?limit=50', { cache: 'no-store' });
      const j = await res.json();
      if (res.ok) setThreads(j.items || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createThread() {
    if (!title.trim() || !body.trim()) { alert('Titolo e testo obbligatori'); return; }
    setCreating(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title, body, category })
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) { alert(j?.error || 'Errore creazione discussione'); return; }
      setTitle(""); setBody("");
      await load();
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Forum" subtitle="Discussioni e commenti" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 divide-y divide-gray-700">
        {loading ? (
          <div className="p-4 text-sm text-gray-400">Caricamento…</div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">Nessuna discussione</div>
        ) : (
          threads.map((t) => (
            <div key={t.id} className="p-4 flex items-start gap-4">
              <div className="text-sm text-gray-400 w-36 shrink-0">{new Date(t.createdAt).toLocaleDateString()}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{t.author?.nome || 'Utente'}</div>
                <div className="text-gray-300">
                  <Link href={`/dashboard/forum/${t.id}`} className="hover:underline">{t.title}</Link>
                </div>
              </div>
              <div className="w-32 text-right">
                <div className="text-xs text-gray-400">{t._count?.posts || 0} risposte</div>
                <Link href={`/dashboard/forum/${t.id}`} className="text-blue-400 hover:underline text-sm">Apri</Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-3 text-white">Crea una nuova discussione</h3>
        <div className="grid gap-2">
          <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-2">
            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
              <option value="citta">Città</option>
              <option value="esperienze">Esperienze</option>
              <option value="eventi">Eventi</option>
              <option value="servizi">Servizi</option>
            </select>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Titolo" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          </div>
          <textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Testo della discussione" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 min-h-[120px]" />
          <button onClick={createThread} disabled={creating} className="self-start bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm">{creating ? 'Creazione…' : 'Pubblica discussione'}</button>
        </div>
      </div>
    </div>
  );
}
