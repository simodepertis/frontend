"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";

function AuthContent() {
  const [tab, setTab] = useState("utente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Login contro la nostra API Next
      const res = await fetch(`/API/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Credenziali non valide");
      
      const data = await res.json();
      // Salva anche nel localStorage come backup
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      
      // Il cookie httpOnly viene impostato dalla API. Basta reindirizzare.
      window.location.href = redirect;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore di autenticazione";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto w-full px-2 py-10">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">Autenticazione</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-8 w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="utente" className="flex-1">Utente</TabsTrigger>
          <TabsTrigger value="escort" className="flex-1">Escort</TabsTrigger>
          <TabsTrigger value="agenzia" className="flex-1">Agenzia</TabsTrigger>
        </TabsList>
        <TabsContent value="utente">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-gray-800 border border-gray-600 rounded-2xl shadow-lg p-8 w-full">
            <input
              type="email"
              placeholder="Email"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl placeholder-gray-300"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl placeholder-gray-300"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full py-3 text-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? "Accesso..." : "Accedi"}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="escort">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-gray-800 border border-gray-600 rounded-2xl shadow-lg p-8 w-full">
            <input
              type="email"
              placeholder="Email"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl placeholder-gray-300"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl placeholder-gray-300"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full py-3 text-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? "Accesso..." : "Accedi"}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="agenzia">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-gray-800 border border-gray-600 rounded-2xl shadow-lg p-8 w-full">
            <input
              type="email"
              placeholder="Email"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl placeholder-gray-300"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl placeholder-gray-300"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full py-3 text-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? "Accesso..." : "Accedi"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
      <div className="text-center mt-6">
        <a href="/registrazione" className="text-blue-600 hover:underline text-lg">Non hai un account? Registrati</a>
      </div>
    </main>
  );
}

export default function Autenticazione() {
  return (
    <Suspense fallback={<main className="max-w-4xl mx-auto w-full px-2 py-10">Caricamento…</main>}>
      <AuthContent />
    </Suspense>
  );
}
