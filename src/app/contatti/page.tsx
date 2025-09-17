"use client";

export default function ContattiPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-neutral-800">Contatti</h1>
      <div className="bg-white border rounded-lg shadow p-6">
        <form className="grid grid-cols-1 gap-4 max-w-xl">
          <input className="bg-white border border-neutral-300 rounded-md px-3 py-2" placeholder="Nome" />
          <input className="bg-white border border-neutral-300 rounded-md px-3 py-2" type="email" placeholder="Email" />
          <textarea className="bg-white border border-neutral-300 rounded-md px-3 py-2" placeholder="Messaggio" rows={5} />
          <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-md py-2 font-semibold">Invia</button>
        </form>
      </div>
    </main>
  );
}
