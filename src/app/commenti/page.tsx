"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faComments } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export default function CommentiPage() {
  const [city, setCity] = useState("");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/commenti-feed');
        if (!res.ok) throw new Error('Errore');
        const { items } = await res.json();
        setItems(items || []);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  const filtered = items; // il feed non contiene la città; filtrare per città non è applicabile qui

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-neutral-800">Commenti</h1>

      {/* Filtri */}
      <div className="mb-8 p-6 bg-neutral-100 rounded-lg shadow-md border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600">Città</label>
            <select className="bg-white border border-neutral-300 rounded-md px-3 py-2" value={city} onChange={(e)=>setCity(e.target.value)}>
              <option value="">Tutte</option>
              <option>Milano</option>
              <option>Roma</option>
              <option>Firenze</option>
            </select>
          </div>
          <div className="hidden md:block" />
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10">
            <FontAwesomeIcon icon={faSearch} className="mr-2" />
            Cerca
          </Button>
        </div>
      </div>

      {/* Lista commenti reali */}
      <div className="bg-white border rounded-lg shadow divide-y">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-500">Nessun commento disponibile.</div>
        ) : filtered.map((c: any) => (
          <div key={c.id} className="px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 grid place-items-center mt-0.5">
              <FontAwesomeIcon icon={faComments} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-neutral-800 truncate">
                  <span className="text-neutral-600 font-normal">da</span> {c.author?.nome || 'Utente'}
                  <span className="text-neutral-600 font-normal"> su </span>
                  {c.target?.slug ? (
                    <Link href={`/escort/${c.target.slug}`} className="text-blue-700 hover:underline">{c.target?.nome || 'Profilo'}</Link>
                  ) : (
                    <span>{c.target?.nome || 'Profilo'}</span>
                  )}
                </div>
                <div className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-sm text-neutral-700 truncate">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
