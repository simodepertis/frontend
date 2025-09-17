"use client";

import { useState } from "react";

export default function CercaPage() {
  const [q, setQ] = useState("");
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-neutral-800">Cerca</h1>
      <div className="bg-neutral-100 rounded-lg border p-6 shadow">
        <form className="flex flex-col md:flex-row gap-3">
          <input
            className="flex-1 bg-white border border-neutral-300 rounded-md px-3 py-2"
            placeholder="Cerca per nome, città, preferenze..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-md px-6 py-2 font-semibold">Cerca</button>
        </form>
      </div>
    </main>
  );
}
