"use client";

export default function DashboardUtentePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard Utente</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-gray-800 border border-gray-600 rounded-lg shadow p-4">
          <h2 className="font-semibold text-white mb-2">Preferiti</h2>
          <p className="text-gray-400">Nessun preferito al momento.</p>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded-lg shadow p-4">
          <h2 className="font-semibold text-white mb-2">Messaggi</h2>
          <p className="text-gray-400">Nessun messaggio.</p>
        </div>
      </div>
    </main>
  );
}
