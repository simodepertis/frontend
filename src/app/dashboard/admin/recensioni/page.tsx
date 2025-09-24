"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type AdminReview = {
  id: number;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  author: { id: number; nome: string; email?: string };
  target: { id: number; nome: string; slug?: string };
};

export default function AdminRecensioniPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<AdminReview[]>([]);
  const [acting, setActing] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/admin/reviews', { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
      if (res.status === 403) { alert('Non autorizzato'); return; }
      if (res.ok) { const j = await res.json(); setList(j?.items || []); }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function act(id: number, action: 'APPROVE' | 'REJECT') {
    setActing(id);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id, action })
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) { alert(j?.error || 'Errore operazione'); return; }
      await load();
    } finally { setActing(null); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Moderazione Recensioni" subtitle="Approva o rifiuta le recensioni inviate dagli utenti" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-gray-400">Nessuna recensione in moderazione</div>
        ) : (
          <div className="space-y-3">
            {list.map(r => (
              <div key={r.id} className="border border-gray-600 bg-gray-900 rounded-md p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-white font-semibold">{r.title} <span className="text-xs text-gray-400">({r.rating}/5)</span></div>
                    <div className="text-sm text-gray-300 whitespace-pre-line">{r.body}</div>
                    <div className="text-xs text-gray-400">Autore: {r.author?.nome} ({r.author?.email || '—'}) · Target: {r.target?.nome} {r.target?.slug ? `(/escort/${r.target.slug})` : ''}</div>
                    <div className="text-xs text-gray-500">Inviata: {new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" disabled={acting===r.id} onClick={()=>act(r.id, 'REJECT')}>{acting===r.id ? '...' : 'Rifiuta'}</Button>
                    <Button disabled={acting===r.id} onClick={()=>act(r.id, 'APPROVE')}>{acting===r.id ? '...' : 'Approva'}</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
