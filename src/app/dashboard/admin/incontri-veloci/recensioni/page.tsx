"use client";

import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

type ReviewItem = {
  id: number;
  title: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  isApproved: boolean;
  isVisible: boolean;
  user: { id: number; nome: string; email: string };
  quickMeeting: { id: number; title: string };
};

export default function AdminIncontriVelociRecensioniPage() {
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState('');
  const [meetingId, setMeetingId] = useState('');

  const [skip, setSkip] = useState(0);
  const take = 200;

  const grouped = useMemo(() => {
    const map = new Map<number, { meeting: ReviewItem['quickMeeting']; reviews: ReviewItem[] }>();
    for (const r of items) {
      const mid = r.quickMeeting?.id;
      if (!mid) continue;
      const existing = map.get(mid);
      if (existing) {
        existing.reviews.push(r);
      } else {
        map.set(mid, { meeting: r.quickMeeting, reviews: [r] });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.meeting.id - b.meeting.id);
  }, [items]);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const params = new URLSearchParams();
      params.set('scope', 'all');
      params.set('take', String(take));
      params.set('skip', String(skip));
      if (q.trim()) params.set('q', q.trim());
      const midNum = Number(meetingId);
      if (Number.isFinite(midNum) && midNum > 0) params.set('meetingId', String(midNum));

      const res = await fetch(`/api/admin/quick-meeting-reviews?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.status === 403) {
        alert('Non autorizzato');
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || 'Errore caricamento');
        return;
      }
      setItems(Array.isArray(j?.items) ? j.items : []);
      setTotal(Number(j?.total) || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setSkip(0);
    await load();
  }

  async function deleteReview(id: number) {
    if (!confirm('Eliminare definitivamente questa recensione?')) return;

    setActing(id);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch(`/api/admin/quick-meeting-reviews?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || 'Errore eliminazione');
        return;
      }
      await load();
    } finally {
      setActing(null);
    }
  }

  const hasPrev = skip > 0;
  const hasNext = skip + take < total;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Admin · Recensioni Incontri Veloci"
        subtitle="Lista completa delle recensioni per ogni annuncio. Puoi eliminarle singolarmente."
      />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4">
        <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
            placeholder="Cerca (titolo recensione, testo, email utente, titolo annuncio)"
          />
          <input
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
            placeholder="Filtra per ID annuncio (opzionale)"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>Cerca</Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={async () => {
                setQ('');
                setMeetingId('');
                setSkip(0);
                await load();
              }}
            >
              Reset
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>Totale: {total}</div>
          <div>
            <Button variant="secondary" disabled={loading || !hasPrev} onClick={() => setSkip((s) => Math.max(0, s - take))}>
              Prev
            </Button>
            <span className="px-3">{skip}–{Math.min(skip + take, total)}</span>
            <Button variant="secondary" disabled={loading || !hasNext} onClick={() => setSkip((s) => s + take)}>
              Next
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : grouped.length === 0 ? (
          <div className="text-sm text-gray-400">Nessuna recensione trovata</div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.meeting.id} className="border border-gray-600 bg-gray-900 rounded-md p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">Annuncio #{g.meeting.id}: {g.meeting.title}</div>
                    <div className="text-xs text-gray-400">Recensioni: {g.reviews.length}</div>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {g.reviews.map((r) => (
                    <div key={r.id} className="border border-gray-700 bg-gray-950 rounded-md p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-white font-semibold">
                            {r.title}{' '}
                            <span className="text-xs text-gray-400">({r.rating}/5)</span>
                            {!r.isVisible ? <span className="ml-2 text-xs text-red-300">(nascosta)</span> : null}
                            {r.isApproved ? <span className="ml-2 text-xs text-green-300">(approvata)</span> : <span className="ml-2 text-xs text-yellow-300">(in attesa)</span>}
                          </div>
                          <div className="text-sm text-gray-300 whitespace-pre-line">{r.reviewText}</div>
                          <div className="text-xs text-gray-400">Autore: {r.user?.nome} ({r.user?.email || '—'})</div>
                          <div className="text-xs text-gray-500">Inviata: {new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            disabled={acting === r.id}
                            onClick={() => deleteReview(r.id)}
                          >
                            {acting === r.id ? '...' : 'Elimina'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
