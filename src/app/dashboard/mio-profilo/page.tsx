"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function MioProfiloPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        if (!res.ok) throw new Error("Non autenticato");
        const data = await res.json();
        setNome(data?.user?.nome ?? "");
        setEmail(data?.user?.email ?? "");
      } catch (e) {
        console.error(e);
        alert("Devi effettuare l'accesso per vedere il profilo");
        // Usa router.push invece di window.location.href
        const userName = localStorage.getItem('user-name') || localStorage.getItem('user-email')?.split('@')[0] || '';
        if (userName) {
          setNome(userName);
          setEmail(localStorage.getItem('user-email') || '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email }),
      });
      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : { error: await res.text() };
      if (!res.ok) throw new Error(payload?.error || "Salvataggio fallito");
      alert("Profilo aggiornato");
      // Aggiorna localStorage
      localStorage.setItem('user-name', nome);
      localStorage.setItem('user-email', email);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChanging(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : { error: await res.text() };
      if (!res.ok) throw new Error(payload?.error || "Cambio password fallito");
      alert("Password aggiornata");
      setOldPassword("");
      setNewPassword("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il cambio password");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Il Mio Profilo" subtitle="Gestisci i tuoi dati personali" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-sm text-gray-300">
        {loading ? (
          <p>Caricamento…</p>
        ) : (
          <form onSubmit={onSaveProfile} className="grid gap-4 max-w-xl">
            <div>
              <label className="block text-xs mb-1 text-white">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-white">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
              {saving ? "Salvataggio…" : "Salva Profilo"}
            </Button>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-sm text-gray-300 max-w-xl">
        <h3 className="font-semibold mb-3 text-white">Cambia Password</h3>
        <form onSubmit={onChangePassword} className="grid gap-4">
          <div>
            <label className="block text-xs mb-1 text-white">Password attuale</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-white">Nuova password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={changing} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
            {changing ? "Aggiornamento…" : "Aggiorna Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
