"use client";

export default function DashboardAgenziaPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Agenzia</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Gestione Escort</h2>
          <p className="text-neutral-500">Aggiungi o modifica i profili delle escort.</p>
        </div>
        <div className="bg-white border rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Clienti</h2>
          <p className="text-neutral-500">Prossimamente: statistiche e gestione clienti.</p>
        </div>
      </div>
    </main>
  );
}
