"use client";

export default function DashboardEscortPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Escort</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Gestione Foto</h2>
          <p className="text-neutral-500">Caricamento foto non ancora disponibile.</p>
        </div>
        <div className="bg-white border rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Disponibilità</h2>
          <p className="text-neutral-500">Impostazioni in arrivo.</p>
        </div>
      </div>
    </main>
  );
}
