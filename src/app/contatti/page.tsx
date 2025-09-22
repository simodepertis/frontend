"use client";

export default function ContattiPage() {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOk("Messaggio inviato. Ti risponderemo via email.");
  };
  const [ok, setOk] = (global as any).React?.useState?.("") || useStateShim("");
  function useStateShim<T>(v: T): [T, (n: T)=>void] { return [v, ()=>{}]; }
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Contatti</h1>
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-2xl">
        {ok && (
          <div className="mb-4 rounded-md border border-green-700 bg-green-900/40 text-green-200 px-3 py-2">{ok}</div>
        )}
        <form onSubmit={submit} className="grid grid-cols-1 gap-4">
          <input className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="Nome" required />
          <input className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" type="email" placeholder="Email" required />
          <textarea className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="Messaggio" rows={5} required />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 font-semibold">Invia</button>
        </form>
      </div>
    </main>
  );
}
