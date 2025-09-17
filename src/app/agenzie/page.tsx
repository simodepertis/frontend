"use client";

export default function AgenzieListPage() {
  const mockAgenzie = [
    { slug: "agency-milano", nome: "Agency Milano", citta: "Milano", escortCount: 8 },
    { slug: "agency-roma", nome: "Agency Roma", citta: "Roma", escortCount: 12 },
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-neutral-800">Agenzie</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAgenzie.map((a) => (
          <div key={a.slug} className="bg-white rounded-lg border shadow p-4">
            <div className="text-xl font-semibold">{a.nome}</div>
            <div className="text-neutral-500">{a.citta}</div>
            <div className="mt-2 text-sm">Escort gestite: {a.escortCount}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
