"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faSearch, faHeart, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionHeader from "@/components/SectionHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function RecensioniPage() {
  const [tab, setTab] = useState("recensioni");
  const [city, setCity] = useState("");
  const [genre, setGenre] = useState("");
  const [dateOrder, setDateOrder] = useState("Più recenti");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/recensioni-feed');
        if (!res.ok) throw new Error('Errore');
        const { items } = await res.json();
        setItems(items || []);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  const filtered = items.filter(r => (!q || String(r.target?.nome || '').toLowerCase().includes(q.toLowerCase())));

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Recensioni" }]} />
      <SectionHeader title="Recensioni" subtitle="Opinioni reali degli utenti, aggiornate ogni giorno" />

      {/* Tabs + pill filters + search */}
      <div className="mb-6 p-3 bg-neutral-100 rounded-lg border shadow-sm">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex gap-2 mb-3">
            <TabsTrigger value="recensioni">Recensioni</TabsTrigger>
            <TabsTrigger value="top_recensori">Top 30 Recensori</TabsTrigger>
            <TabsTrigger value="top_donne">Top 30 Donne</TabsTrigger>
          </TabsList>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2 md:w-40" value={city} onChange={(e)=>setCity(e.target.value)}>
              <option value="">Città</option>
              <option>Milano</option>
              <option>Roma</option>
              <option>Firenze</option>
            </select>
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2 md:w-40" value={genre} onChange={(e)=>setGenre(e.target.value)}>
              <option value="">Genere</option>
              <option>Donna</option>
              <option>Trans</option>
            </select>
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2 md:w-48" value={dateOrder} onChange={(e)=>setDateOrder(e.target.value)}>
              <option>Più recenti</option>
              <option>Meno recenti</option>
            </select>
            <div className="relative flex-1">
              <input className="w-full bg-white border border-neutral-300 rounded-md pl-10 pr-3 py-2" placeholder="Cerca per nome" value={q} onChange={(e)=>setQ(e.target.value)} />
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-5">Filtra</Button>
          </div>

          {/* Tab Recensioni: lista reale dal feed */}
          <TabsContent value="recensioni">
            <div className="mt-4 bg-white border rounded-lg shadow-sm divide-y">
              {filtered.length === 0 ? (
                <div className="p-4 text-sm text-neutral-500">Nessuna recensione disponibile.</div>
              ) : filtered.map((r: any) => (
                <div key={r.id} className="p-3 md:p-4 flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                    <Image src={r.target?.coverUrl || '/placeholder.jpg'} alt={r.target?.nome || 'Profilo'} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {r.target?.slug ? (
                        <Link href={`/escort/${r.target.slug}`} className="text-blue-700 hover:underline font-semibold truncate">{r.target?.nome || 'Profilo'}</Link>
                      ) : (
                        <span className="font-semibold truncate">{r.target?.nome || 'Profilo'}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FontAwesomeIcon key={i} icon={faStar} className={i < (r.rating ?? 0) ? "" : "text-neutral-300"} />
                        ))}
                      </div>
                      <div className="text-neutral-700 truncate">{r.title}</div>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end gap-1 text-right">
                    <div className="text-sm text-neutral-600">{new Date(r.createdAt).toLocaleDateString()}</div>
                    <span className="text-xs text-neutral-500">da {r.author?.nome || 'Utente'}</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="text-neutral-400" />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab Top 30 Recensori (placeholder coerente) */}
          <TabsContent value="top_recensori">
            <div className="mt-4 bg-white border rounded-lg shadow-sm p-4 text-neutral-600">
              Classifica recensori in arrivo.
            </div>
          </TabsContent>

          {/* Tab Top 30 Donne (placeholder coerente) */}
          <TabsContent value="top_donne">
            <div className="mt-4 bg-white border rounded-lg shadow-sm p-4 text-neutral-600">
              Classifica donne più recensite in arrivo.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
