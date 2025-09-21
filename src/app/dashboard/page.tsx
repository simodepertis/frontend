"use client";

import SectionHeader from "@/components/SectionHeader";
import Image from "next/image";
import Link from "next/link";
import { stories, forumActivities, notifications } from "@/lib/mock";
import { useEffect, useMemo, useState } from "react";

export default function DashboardHome() {
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/API/user/me");
        if (res.ok) {
          const data = await res.json();
          setName(data?.user?.nome ?? "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    (async () => {
      setLoadingItems(true);
      try {
        const res = await fetch('/API/public/annunci');
        if (res.ok) {
          const j = await res.json();
          setItems(j.items || []);
        } else {
          setItems([]);
        }
      } finally { setLoadingItems(false); }
    })();
  }, []);

  const latest = useMemo(() => items.slice(0, 8), [items]);
  const hh = useMemo(() => {
    const first = items[0];
    if (!first) return {
      url: '/annunci',
      photo: '/placeholder.svg',
      name: 'Promo',
      city: '—',
      duration: '30 minuti',
      oldPrice: '220 EUR',
      newPrice: '180 EUR',
    };
    return {
      url: `/escort/${first.slug}`,
      photo: first.coverUrl || '/placeholder.svg',
      name: first.name,
      city: Array.isArray(first.cities) && first.cities[0] ? String(first.cities[0]) : '—',
      duration: '30 minuti',
      oldPrice: '220 EUR',
      newPrice: '180 EUR',
    };
  }, [items]);
  return (
    <div className="space-y-6">
      <SectionHeader title={loading ? "Area Privata" : `Ciao${name ? ", " + name : ""}!`} subtitle="Riepilogo rapido e novità" />

      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm text-neutral-600">
          Il tuo codice cliente: <span className="font-semibold">3579464</span>
        </div>
      </div>

      {/* Happy Hour */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-lg font-semibold mb-3">Happy Hour</h3>
        <Link href={hh.url} className="flex items-center gap-4 border rounded-lg p-3 hover:border-red-400 transition-colors">
          <div className="relative w-20 h-20 rounded-md overflow-hidden">
            <Image src={hh.photo || '/placeholder.svg'} alt={hh.name} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">{hh.name} <span className="text-neutral-500">— {hh.city}</span></div>
            <div className="text-xs text-neutral-500">{hh.duration}</div>
          </div>
          <div className="text-right">
            <div className="text-xs line-through text-neutral-400">{hh.oldPrice}</div>
            <div className="text-red-600 font-bold">{hh.newPrice}</div>
          </div>
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Ultimi Profili Aggiornati</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(loadingItems ? [] : latest).map((e: any) => (
            <Link key={e.id} href={`/escort/${e.slug}`} className="block group">
              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl border shadow-sm bg-white">
                <Image src={e.coverUrl || '/placeholder.svg'} alt={e.name} fill className="object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="mt-2 px-0.5">
                <div className="text-sm font-semibold text-neutral-800 truncate group-hover:underline">{e.name}</div>
                <div className="text-xs text-neutral-500 truncate">{Array.isArray(e.cities)&&e.cities[0]? String(e.cities[0]) : '—'}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Ultime Storie Caricate */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-lg font-semibold mb-3">Ultime Storie Caricate</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {stories.map((s) => (
            <div key={s.id} className="flex flex-col items-center min-w-[72px]">
              <div className="relative w-16 h-16 rounded-full border-2 border-red-400 overflow-hidden">
                <Image src={s.avatar} alt={s.name} fill className="object-cover" />
                {s.unread > 0 && (
                  <span className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full text-[10px] px-1.5 py-0.5">
                    {s.unread}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-neutral-700 max-w-[72px] truncate">{s.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ultima Attività del Forum */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-lg font-semibold mb-3">Ultima Attività del Forum</h3>
        {forumActivities.map((f) => (
          <div key={f.id} className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="text-sm font-semibold">{f.author}</div>
              <div className="text-xs text-neutral-500">{f.date}</div>
              <div className="text-sm mt-1 text-neutral-800">{f.title}</div>
            </div>
            <Link href={f.url} className="text-blue-600 hover:underline text-sm font-semibold">RISpondi</Link>
          </div>
        ))}
      </div>

      {/* Le tue Notifiche */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-lg font-semibold mb-3">Le tue Notifiche</h3>
        <div className="divide-y">
          {notifications.map((n) => (
            <div key={n.id} className="py-2 flex items-center justify-between">
              <div className="text-sm text-neutral-800">{n.text}</div>
              <div className="text-xs text-neutral-500">{n.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
