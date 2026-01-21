"use client";

import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

function hash32(seed: number) {
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

function base36(n: number) {
  return Math.abs(n).toString(36);
}

function toEaHandleRaw(input: unknown, seed: number) {
  const raw = String(input || '').trim();
  const looksLikeHandle = raw.length >= 3 && !raw.includes(' ') && /[0-9_\.]/.test(raw);

  if (looksLikeHandle) {
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9_\.]/g, '').slice(0, 18);
    return cleaned || `user_${base36(seed).slice(0, 6)}`;
  }

  const prefixes = [
    'neo','meta','ultra','super','dark','quiet','wild','urban','lunar','solar','alpha','omega','delta','sigma','prime','zero','hyper','retro','steel','gold',
    'mister','signor','capo','dr','mr','sir','il','lo','the','king','real','true','just','only','max','mini','big','tiny','fast','slow',
    'blue','red','black','white','green','gray','night','day','sun','moon','star','nova','sky','deep','cold','hot','zen','koi','fox','wolf',
    'hawk','raven','eagle','tiger','lion','bear','cobra','viper','shark','orca','puma','panther','storm','rain','wind','snow','fire','ice','rock','wave',
  ];
  const cores = [
    'nico','marco','luca','alex','fede','mike','ste','dany','ivan','toni','vale','simo','ricky','tommy','kevin','roger','fabio','sam','leo','max',
    'runner','driver','rider','walker','seeker','shadow','ghost','ninja','joker','vandal','pirate','viking','samurai','ronin','ranger','hunter','builder','maker','pilot','captain',
    'atlas','orion','vega','zeus','thor','odin','ares','helios','cosmo','astro','omega','alpha','sigma','drake','blade','flash','spark','ember','stone','river',
  ];
  const suffixes = [
    'it','x','xx','99','88','77','66','55','44','33','22','11','00','pro','vip','real','live','now','one','two','three','five','seven',
    'north','south','east','west','city','zone','street','night','day','moon','sun','star','nova','lab','hub','club','crew','team','gang','base',
  ];

  const h = hash32(seed);
  const p = prefixes[h % prefixes.length];
  const c = cores[(h >>> 8) % cores.length];
  const s = suffixes[(h >>> 16) % suffixes.length];
  const digits = String(h % 1000).padStart(3, '0');
  const tail = base36(h).padStart(6, '0').slice(0, 6);
  const style = h % 7;

  if (style === 0) return `${c}${digits}`.slice(0, 18);
  if (style === 1) return `${c}_${digits}`.slice(0, 18);
  if (style === 2) return `${p}${c}${digits}`.slice(0, 18);
  if (style === 3) return `${p}_${c}${digits}`.slice(0, 18);
  if (style === 4) return `${c}_${s}${digits}`.slice(0, 18);
  if (style === 5) return `${p}_${c}_${s}`.slice(0, 18);
  return `${c}${tail}`.slice(0, 18);
}

function toEaHandleUnique(input: unknown, seed: number, used: Set<string>, usedBases: Set<string>) {
  let h = toEaHandleRaw(input, seed);

  const basePart = (s: string) => {
    const m = String(s || '').toLowerCase().match(/^[a-z]+/);
    return m ? m[0] : '';
  };
  const base = basePart(h);

  if (base && usedBases.has(base)) {
    for (let k = 1; k <= 10; k++) {
      const alt = toEaHandleRaw(input, seed + k * 1337);
      const altBase = basePart(alt);
      if (altBase && !usedBases.has(altBase) && !used.has(alt)) {
        usedBases.add(altBase);
        used.add(alt);
        return alt;
      }
    }
  }

  if (!used.has(h)) {
    used.add(h);
    if (base) usedBases.add(base);
    return h;
  }

  for (let i = 1; i <= 5; i++) {
    const extra = base36(hash32(seed + i * 997)).padStart(4, '0').slice(0, 4);
    const candidate = `${h}_${extra}`.slice(0, 22);
    if (!used.has(candidate)) {
      used.add(candidate);
      const cb = basePart(candidate);
      if (cb) usedBases.add(cb);
      return candidate;
    }
  }
  const fallback = `user_${base36(hash32(seed + 9999)).slice(0, 8)}`;
  used.add(fallback);
  return fallback;
}

type ReviewItem = {
  kind?: 'manual' | 'imported' | 'imported_pool';
  id: number;
  title: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  isApproved: boolean;
  isVisible: boolean;
  user: { id: number; nome: string; email: string };
  quickMeeting: { id: number; title: string };
  meta?: any;
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
    const map = new Map<number, { meeting: ReviewItem['quickMeeting']; reviews: (ReviewItem & { displayNome?: string })[] }>();
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

    const out = Array.from(map.values()).sort((a, b) => a.meeting.id - b.meeting.id);

    for (const g of out) {
      const used = new Set<string>();
      const usedBases = new Set<string>();
      g.reviews = g.reviews.map((r) => {
        if (r.kind === 'imported_pool' && r.meta?.originalImportedReviewId) {
          const seed = (g.meeting.id || 0) * 200000 + Number(r.meta.originalImportedReviewId);
          const name = toEaHandleUnique(r.user?.nome, seed, used, usedBases);
          return { ...r, displayNome: name };
        }
        if (r.kind === 'imported' && r.meta?.sourceUrl && String(r.meta.sourceUrl).includes('escort-advisor.com')) {
          const seed = (g.meeting.id || 0) * 200000 + Number(r.id || 0);
          const name = toEaHandleUnique(r.user?.nome, seed, used, usedBases);
          return { ...r, displayNome: name };
        }
        return r;
      });
    }

    return out;
  }, [items]);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const params = new URLSearchParams();
      params.set('scope', 'all');
      params.set('take', String(take));
      params.set('skip', String(skip));
      if (q.trim()) {
        const qTrim = q.trim();
        params.set('q', qTrim);
        const digitsOnly = qTrim.replace(/\D/g, '');
        if (digitsOnly.length >= 6) {
          params.set('poolOnly', '1');
          params.set('poolLimit', '5');
        }
      }
      const midNum = Number(meetingId);
      if (Number.isFinite(midNum) && midNum > 0) params.set('meetingId', String(midNum));

      const ts = Date.now();
      params.set('_', String(ts));
      const res = await fetch(`/api/admin/quick-meeting-reviews?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'cache-control': 'no-cache',
        },
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

  async function deleteReview(id: number, kind?: ReviewItem['kind']) {
    if (!confirm('Eliminare definitivamente questa recensione?')) return;

    setActing(id);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const params = new URLSearchParams();
      params.set('id', String(id));
      if (kind === 'imported') params.set('kind', 'imported');
      const res = await fetch(`/api/admin/quick-meeting-reviews?${params.toString()}`, {
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
                            {r.kind === 'imported' ? <span className="ml-2 text-xs text-blue-300">(bot)</span> : null}
                            {r.kind === 'imported_pool' ? <span className="ml-2 text-xs text-purple-300">(pool)</span> : null}
                            {!r.isVisible ? <span className="ml-2 text-xs text-red-300">(nascosta)</span> : null}
                            {r.isApproved ? <span className="ml-2 text-xs text-green-300">(approvata)</span> : <span className="ml-2 text-xs text-yellow-300">(in attesa)</span>}
                          </div>
                          <div className="text-sm text-gray-300 whitespace-pre-line">{r.reviewText}</div>
                          <div className="text-xs text-gray-400">Autore: {(r as any).displayNome || r.user?.nome} ({r.user?.email || '—'})</div>
                          {(r.kind === 'imported' || r.kind === 'imported_pool') && r.meta?.sourceUrl ? (
                            <div className="text-xs text-gray-400">Source: {r.meta.sourceUrl}</div>
                          ) : null}
                          <div className="text-xs text-gray-500">Inviata: {new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            disabled={acting === r.id}
                            onClick={() => {
                              if (r.kind === 'imported_pool' && r.meta?.originalImportedReviewId) {
                                deleteReview(Number(r.meta.originalImportedReviewId), 'imported');
                                return;
                              }
                              deleteReview(r.id, r.kind);
                            }}
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
