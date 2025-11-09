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

type QuickMeetingReview = {
  id: number;
  title: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  user: { id: number; nome: string; email: string };
  quickMeeting: { id: number; title: string };
};

export default function AdminRecensioniPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<AdminReview[]>([]);
  const [quickMeetingReviews, setQuickMeetingReviews] = useState<QuickMeetingReview[]>([]);
  const [acting, setActing] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'escort' | 'incontri'>('escort');

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/admin/reviews', { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
      if (res.status === 403) { alert('Non autorizzato'); return; }
      if (res.ok) { const j = await res.json(); setList(j?.items || []); }
    } finally { setLoading(false); }
  }

  async function loadQuickMeetingReviews() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/admin/quick-meeting-reviews', { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
      if (res.status === 403) { alert('Non autorizzato'); return; }
      if (res.ok) { const j = await res.json(); setQuickMeetingReviews(j?.items || []); }
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (activeTab === 'escort') {
      load();
    } else {
      loadQuickMeetingReviews();
    }
  }, [activeTab]);

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

  async function actQuickMeeting(id: number, action: 'APPROVE' | 'REJECT') {
    setActing(id);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/admin/quick-meeting-reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id, action })
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) { alert(j?.error || 'Errore operazione'); return; }
      await loadQuickMeetingReviews();
    } finally { setActing(null); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin · Moderazione Recensioni" subtitle="Approva o rifiuta le recensioni inviate dagli utenti" />

      {/* Tab Selector */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('escort')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            activeTab === 'escort'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Recensioni Escort
        </button>
        <button
          onClick={() => setActiveTab('incontri')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            activeTab === 'incontri'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Recensioni Incontri Veloci
        </button>
      </div>

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5">
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : activeTab === 'escort' ? (
          list.length === 0 ? (
            <div className="text-sm text-gray-400">Nessuna recensione escort in moderazione</div>
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
          )
        ) : (
          quickMeetingReviews.length === 0 ? (
            <div className="text-sm text-gray-400">Nessuna recensione incontri veloci in moderazione</div>
          ) : (
            <div className="space-y-3">
              {quickMeetingReviews.map(r => (
                <div key={r.id} className="border border-gray-600 bg-gray-900 rounded-md p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-white font-semibold">{r.title} <span className="text-xs text-gray-400">({r.rating}/5)</span></div>
                      <div className="text-sm text-gray-300 whitespace-pre-line">{r.reviewText}</div>
                      <div className="text-xs text-gray-400">Autore: {r.user?.nome} ({r.user?.email || '—'}) · Incontro: {r.quickMeeting?.title} (#ID: {r.quickMeeting?.id})</div>
                      <div className="text-xs text-gray-500">Inviata: {new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" disabled={acting===r.id} onClick={()=>actQuickMeeting(r.id, 'REJECT')}>{acting===r.id ? '...' : 'Rifiuta'}</Button>
                      <Button disabled={acting===r.id} onClick={()=>actQuickMeeting(r.id, 'APPROVE')}>{acting===r.id ? '...' : 'Approva'}</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
