"use client";

export default function DashboardUtentePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Utente</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Preferiti</h2>
          <p className="text-neutral-500">Nessun preferito al momento.</p>
        </div>
        <div className="bg-white border rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Messaggi</h2>
          <p className="text-neutral-500">Nessun messaggio.</p>
        </div>
      </div>
    </main>
  );
}
