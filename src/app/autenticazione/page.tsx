"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Autenticazione() {
  const [tab, setTab] = useState("utente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const type = tab === "utente" ? "user" : "model";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, type }),
      });
      if (!res.ok) throw new Error("Credenziali non valide");
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("jwt", data.access_token);
        alert("Accesso effettuato con successo!");
        window.location.href = "/";
      } else {
        throw new Error("Token non ricevuto");
      }
    } catch (err: any) {
      alert(err.message || "Errore di autenticazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto w-full px-2 py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">Autenticazione</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-8 w-full">
        <TabsList className="w-full flex justify-center">
          <TabsTrigger value="utente" className="flex-1">Utente</TabsTrigger>
          <TabsTrigger value="modella" className="flex-1">Modella</TabsTrigger>
        </TabsList>
        <TabsContent value="utente">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white border border-neutral-200 rounded-2xl shadow-lg p-8 w-full">
            <input
              type="email"
              placeholder="Email"
              className="border rounded-lg px-6 py-3 focus:outline-none focus:ring text-xl"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="border rounded-lg px-6 py-3 focus:outline-none focus:ring text-xl"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full py-3 text-xl" style={{ color: '#f3d074' }} disabled={loading}>
              {loading ? "Accesso..." : "Accedi"}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="modella">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white border border-neutral-200 rounded-2xl shadow-lg p-8 w-full">
            <input
              type="email"
              placeholder="Email"
              className="border rounded-lg px-6 py-3 focus:outline-none focus:ring text-xl"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="border rounded-lg px-6 py-3 focus:outline-none focus:ring text-xl"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full py-3 text-xl" style={{ color: '#f3d074' }} disabled={loading}>
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
