"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";

export default function AdminAnnunciModerazionePage() {
  type Item = { id: number; title: string; city: string; type: string; createdAt: string; user?: { id: number; nome?: string } };
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  type QuickMeeting = {
    id: number;
    title: string;
    city: string;
    category: string;
    isActive: boolean;
    userId: number | null;
    sourceId?: string | null;
    createdAt: string;
    photos?: any;
    isSuperTop?: boolean;
    activePackages?: { code: string; label: string; type: string; durationDays: number }[];
  };
  const [qmLoading, setQmLoading] = useState(true);
  const [qmErr, setQmErr] = useState('');
  const [qm, setQm] = useState<QuickMeeting[]>([]);
  const [qmQ, setQmQ] = useState('');
  const [qmDeleting, setQmDeleting] = useState<number | null>(null);
  const [qmSkip, setQmSkip] = useState(0);
  const [qmTake] = useState(200);
  const [qmCounts, setQmCounts] = useState<{ superTop: number; normal: number }>({ superTop: 0, normal: 0 });

  async function load() {
    setLoading(true); setErr("");
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/admin/listings?status=IN_REVIEW', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Errore');
      setItems(j.items || []);
    } catch (e:any) {
      setErr(e?.message || 'Errore');
    } finally { setLoading(false); }
  }

  async function loadQuickMeetings() {
    setQmLoading(true);
    setQmErr('');
    try {
      const token = localStorage.getItem('auth-token') || '';
      const q = qmQ.trim();
      const res = await fetch(`/api/admin/quick-meetings?take=${qmTake}&skip=${qmSkip}${q ? `&q=${encodeURIComponent(q)}` : ''}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Errore caricamento incontri veloci');
      const superTop = (j.superTopMeetings || []) as QuickMeeting[];
      const normal = (j.normalMeetings || []) as QuickMeeting[];
      setQm([...superTop, ...normal]);
      setQmCounts(j.counts || { superTop: superTop.length, normal: normal.length });
    } catch (e: any) {
      setQmErr(e?.message || 'Errore caricamento incontri veloci');
      setQm([]);
      setQmCounts({ superTop: 0, normal: 0 });
    } finally {
      setQmLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadQuickMeetings(); }, []);
  useEffect(() => { loadQuickMeetings(); }, [qmSkip]);

  async function act(id: number, action: 'PUBLISH'|'REJECT') {
    setUpdating(id);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/admin/listings', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, 
        body: JSON.stringify({ id, action }) 
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Errore');
      await load();
    } catch (e) {
      const msg = (e as any)?.message || 'Errore operazione';
      setErr(msg);
    } finally {
      setUpdating(null);
    }
  }

  async function deleteQuickMeeting(id: number) {
    if (!window.confirm('Sei sicuro di voler eliminare questo annuncio di incontro veloce?')) return;
    setQmDeleting(id);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch(`/api/admin/quick-meetings?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Errore eliminazione');
      setQm((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Errore eliminazione');
    } finally {
      setQmDeleting(null);
    }
  }

  const qmSuperTop = qm.filter((m) => !!m.isSuperTop);
  const qmNormal = qm.filter((m) => !m.isSuperTop);
  const qmHasPrev = qmSkip > 0;
  const qmHasNext = qmSkip + qmTake < (qmCounts.normal || 0);

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Moderazione Annunci" subtitle="Approva o rifiuta gli annunci creati dagli utenti" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        {loading ? (
          <div className="text-gray-400 text-sm">Caricamento…</div>
        ) : err ? (
          <div className="text-red-300 text-sm">{err}</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400 text-sm">Nessun annuncio in revisione.</div>
        ) : (
          <div className="space-y-3">
            {items.map(i => (
              <div key={i.id} className="border border-gray-600 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-sm">{i.title}</div>
                  <div className="text-xs text-gray-400">{i.city} · {i.type} · Autore: {i.user?.nome || i.user?.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" disabled={updating===i.id} onClick={()=>act(i.id,'REJECT')}>Rifiuta</Button>
                  <Button disabled={updating===i.id} onClick={()=>act(i.id,'PUBLISH')}>Pubblica</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-white font-semibold">Incontri Veloci (tutti)</div>
            <div className="text-xs text-gray-400">Include anche annunci importati dal bot. Separati in SuperTop e Normali.</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={qmQ}
              onChange={(e) => setQmQ(e.target.value)}
              placeholder="Cerca titolo/città/telefono..."
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
            />
            <Button
              onClick={() => {
                setQmSkip(0);
                loadQuickMeetings();
              }}
              disabled={qmLoading}
            >
              Cerca
            </Button>
          </div>
        </div>

        {qmLoading ? (
          <div className="text-gray-400 text-sm mt-3">Caricamento…</div>
        ) : qmErr ? (
          <div className="text-red-300 text-sm mt-3">{qmErr}</div>
        ) : (
          <div className="mt-4 space-y-6">
            <div>
              <div className="text-sm font-semibold text-yellow-200 mb-2">SuperTop ({qmCounts.superTop || qmSuperTop.length})</div>
              {qmSuperTop.length === 0 ? (
                <div className="text-gray-400 text-sm">Nessun annuncio SuperTop.</div>
              ) : (
                <div className="space-y-2">
                  {qmSuperTop.map((m) => (
                    <div key={m.id} className="border border-yellow-500/30 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold text-sm">#{m.id} · {m.title}</div>
                        <div className="text-xs text-gray-400">{m.city} · {m.category} · {m.userId ? `User #${m.userId}` : 'BOT/IMPORT'} · {m.isActive ? 'Attivo' : 'Disattivato'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/incontri-veloci/dettaglio?id=${m.id}`}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs text-white"
                        >
                          Modifica
                        </Link>
                        <button
                          type="button"
                          disabled={qmDeleting === m.id}
                          onClick={() => deleteQuickMeeting(m.id)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs text-white disabled:opacity-50"
                        >
                          {qmDeleting === m.id ? '...' : 'Elimina'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="text-sm font-semibold text-gray-200">Normali ({qmCounts.normal || qmNormal.length})</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={qmLoading || !qmHasPrev}
                    onClick={() => setQmSkip((s) => Math.max(0, s - qmTake))}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-white disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    disabled={qmLoading || !qmHasNext}
                    onClick={() => setQmSkip((s) => s + qmTake)}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-white disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
              {qmNormal.length === 0 ? (
                <div className="text-gray-400 text-sm">Nessun annuncio normale.</div>
              ) : (
                <div className="space-y-2">
                  {qmNormal.map((m) => (
                    <div key={m.id} className="border border-gray-700 rounded-md p-3 bg-gray-900 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold text-sm">#{m.id} · {m.title}</div>
                        <div className="text-xs text-gray-400">{m.city} · {m.category} · {m.userId ? `User #${m.userId}` : 'BOT/IMPORT'} · {m.isActive ? 'Attivo' : 'Disattivato'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/incontri-veloci/dettaglio?id=${m.id}`}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs text-white"
                        >
                          Modifica
                        </Link>
                        <button
                          type="button"
                          disabled={qmDeleting === m.id}
                          onClick={() => deleteQuickMeeting(m.id)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs text-white disabled:opacity-50"
                        >
                          {qmDeleting === m.id ? '...' : 'Elimina'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
