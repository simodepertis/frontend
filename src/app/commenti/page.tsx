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
      <h1 className="text-3xl font-bold mb-6 text-white">Commenti</h1>

      {/* Filtri */}
      <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-white">Città</label>
            <select className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={city} onChange={(e)=>setCity(e.target.value)}>
              <option value="">Tutte</option>
              <option>Milano</option>
              <option>Roma</option>
              <option>Firenze</option>
            </select>
          </div>
          <div className="hidden md:block" />
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10">
            <FontAwesomeIcon icon={faSearch} className="mr-2" />
            Cerca
          </Button>
        </div>
      </div>

      {/* Lista commenti reali */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg divide-y divide-gray-700">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-400">Nessun commento disponibile.</div>
        ) : filtered.map((c: any) => (
          <div key={c.id} className="px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center mt-0.5">
              <FontAwesomeIcon icon={faComments} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white truncate">
                  <span className="text-gray-400 font-normal">da</span> {c.author?.nome || 'Utente'}
                  <span className="text-gray-400 font-normal"> su </span>
                  {c.target?.slug ? (
                    <Link href={`/escort/${c.target.slug}`} className="text-blue-400 hover:underline">{c.target?.nome || 'Profilo'}</Link>
                  ) : (
                    <span>{c.target?.nome || 'Profilo'}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-sm text-gray-300 truncate">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
