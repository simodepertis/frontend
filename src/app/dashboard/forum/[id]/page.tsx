"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SectionHeader from "@/components/SectionHeader";

type Thread = {
  id: number;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  author: { id: number; nome: string };
  posts: Array<{ id: number; body: string; createdAt: string; author: { id: number; nome: string } }>;
};

export default function ThreadPage() {
  const params = useParams();
  const id = Number(params?.id || 0);
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/threads/${id}`, { cache: 'no-store' });
      const j = await res.json();
      if (res.ok) setThread(j.item || null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ threadId: id, body: reply })
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) { alert(j?.error || 'Errore invio risposta'); return; }
      setReply("");
      await load();
    } finally { setSending(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Forum" subtitle="Discussione" />
      {loading ? (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-sm text-gray-400">Caricamento…</div>
      ) : !thread ? (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-sm text-gray-400">Discussione non trovata</div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
            <div className="text-xs text-gray-400">{new Date(thread.createdAt).toLocaleString()} · {thread.category}</div>
            <div className="text-lg font-semibold text-white mt-1">{thread.title}</div>
            <div className="text-sm text-gray-300 mt-2 whitespace-pre-line">{thread.body}</div>
            <div className="text-xs text-gray-500 mt-1">di {thread.author?.nome || 'Utente'}</div>
          </div>

          <div className="rounded-lg border border-gray-600 bg-gray-800 divide-y divide-gray-700">
            {thread.posts.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">Nessuna risposta</div>
            ) : (
              thread.posts.map(p => (
                <div key={p.id} className="p-4">
                  <div className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()} · {p.author?.nome || 'Utente'}</div>
                  <div className="text-sm text-gray-300 whitespace-pre-line mt-1">{p.body}</div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
            <div className="font-semibold mb-2 text-white">Rispondi</div>
            <textarea value={reply} onChange={(e)=>setReply(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 min-h-[120px] w-full" placeholder="Scrivi la tua risposta" />
            <button onClick={sendReply} disabled={sending || !reply.trim()} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm">{sending ? 'Invio…' : 'Invia risposta'}</button>
          </div>
        </>
      )}
    </div>
  );
}
