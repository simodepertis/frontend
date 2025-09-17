"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function RegistrazionePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Logica di invio...
    console.log("Submit per:", { email, password, nome });
    alert(`Registrazione inviata!`);
    setLoading(false);
  };

  return (
    <main className="container mx-auto px-4 py-12 flex justify-center">
      <div className="w-full max-w-md p-8 bg-neutral-100 rounded-lg shadow-md border">
        <h1 className="text-3xl font-bold mb-6 text-center text-neutral-800">Crea il tuo Account</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="nome" className="text-sm font-medium text-neutral-600">
              Nome / Nickname
            </label>
            <input
              id="nome"
              type="text"
              placeholder="Come ti chiami?"
              className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-neutral-600">Email</label>
            <input
              id="email"
              type="email"
              placeholder="tua@email.com"
              className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-neutral-600">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-3 mt-4 rounded-md"
            disabled={loading}
          >
            {loading ? "Registrazione in corso..." : "Registrati"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <a href="/autenticazione" className="text-red-600 hover:underline">
            Hai già un account? Accedi
          </a>
        </div>
      </div>
    </main>
  );
}