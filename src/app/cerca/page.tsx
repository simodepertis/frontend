"use client";

import { useState } from "react";

export default function CercaPage() {
  const [q, setQ] = useState("");
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Cerca</h1>
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 shadow-lg">
        <form className="flex flex-col md:flex-row gap-3">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            placeholder="Cerca per nome, città, preferenze..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-3 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Cerca
          </button>
        </form>
      </div>
    </main>
  );
}
