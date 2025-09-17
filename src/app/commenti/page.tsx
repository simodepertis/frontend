"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faComments } from "@fortawesome/free-solid-svg-icons";

const threads = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  title: `Discussione #${i + 1}`,
  author: ["Alessio", "Giada", "Marta", "Luca"][i % 4],
  city: ["Milano", "Roma", "Firenze"][i % 3],
  preview: "Commenti recenti sulla qualità del servizio e consigli tra utenti.",
  replies: 2 + (i % 7),
  updatedAt: `2025-09-${12 + i}`,
}));

export default function CommentiPage() {
  const [city, setCity] = useState("");

  const filtered = threads.filter(t => (!city || t.city === city));

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

      {/* Lista discussioni */}
      <div className="bg-white border rounded-lg shadow divide-y">
        {filtered.map((t) => (
          <div key={t.id} className="px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 grid place-items-center mt-0.5">
              <FontAwesomeIcon icon={faComments} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-neutral-800 truncate">{t.title}</div>
                <div className="text-xs text-neutral-500">{t.updatedAt}</div>
              </div>
              <div className="text-sm text-neutral-600 truncate">{t.preview}</div>
              <div className="mt-1 text-xs text-neutral-500">{t.author} · {t.city} · {t.replies} risposte</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
