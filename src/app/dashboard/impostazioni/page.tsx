"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ImpostazioniPage() {
  const [lang, setLang] = useState("it");
  const [newsletter, setNewsletter] = useState(true);
  const [viewLabel, setViewLabel] = useState("visti");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    // Carica preferenze locali (demo); in futuro DB
    const storedLang = localStorage.getItem("pref-lang");
    const storedNews = localStorage.getItem("pref-newsletter");
    const storedLabel = localStorage.getItem("pref-viewLabel");
    if (storedLang) setLang(storedLang);
    if (storedNews) setNewsletter(storedNews === "true");
    if (storedLabel) setViewLabel(storedLabel);
  }, []);

  const savePrefs = () => {
    localStorage.setItem("pref-lang", lang);
    localStorage.setItem("pref-newsletter", String(newsletter));
    localStorage.setItem("pref-viewLabel", viewLabel);
    alert("Preferenze salvate");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      alert("Le password non coincidono");
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : { error: await res.text() };
      if (!res.ok) throw new Error(payload?.error || "Errore cambio password");
      alert("Password aggiornata");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il cambio password");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Impostazioni" subtitle="Account, sicurezza e preferenze" />

      <div className="rounded-lg border bg-white p-4 text-sm text-neutral-700 space-y-6">
        <p>Il tuo account è attivo. Le modifiche sotto riguardano lingua, sicurezza e comunicazioni.</p>

        {/* Lingua preferita */}
        <section>
          <h3 className="font-semibold mb-2">Lingua preferita</h3>
          <div className="flex items-center gap-3 max-w-md">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2 w-full"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
            <Button onClick={savePrefs}>Salva</Button>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Usata per email e notifiche automatiche.</p>
        </section>

        {/* Cambia password */}
        <section>
          <h3 className="font-semibold mb-2">Cambia password</h3>
          <form onSubmit={changePassword} className="grid gap-3 max-w-md">
            <input
              type="password"
              placeholder="Inserisci la password attuale"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="Inserisci la nuova password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2"
                required
                minLength={6}
              />
              <input
                type="password"
                placeholder="Conferma nuova password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2"
                required
                minLength={6}
              />
            </div>
            <p className="text-xs text-neutral-500">La tua nuova password deve avere almeno 6 caratteri e contenere lettere e numeri.</p>
            <Button type="submit" disabled={savingPwd} className="w-full md:w-auto">{savingPwd ? "Salvataggio…" : "Salva modifiche"}</Button>
          </form>
        </section>

        {/* Newsletter */}
        <section>
          <h3 className="font-semibold mb-2">Newsletter</h3>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
            <span>Voglio ricevere le newsletter di incontriescort.org</span>
          </label>
          <div className="mt-2">
            <Button onClick={savePrefs}>Salva preferenze</Button>
          </div>
        </section>

        {/* Profili Visti */}
        <section>
          <h3 className="font-semibold mb-2">Profili Visti</h3>
          <div className="flex items-center gap-3 max-w-md">
            <select
              value={viewLabel}
              onChange={(e) => setViewLabel(e.target.value)}
              className="bg-white border border-neutral-300 text-neutral-800 rounded-md px-3 py-2 w-full"
            >
              <option value="visti">Profili Visti</option>
              <option value="nessuna">Nessuna etichetta</option>
            </select>
            <Button onClick={savePrefs}>Salva</Button>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Etichetta “Visto” applicata ai profili già visitati.</p>
        </section>

        {/* Impostazioni degli avvisi */}
        <section>
          <h3 className="font-semibold mb-2">Impostazioni degli avvisi</h3>
          <p className="text-sm text-neutral-600">Scegli come desideri ricevere gli avvisi.</p>
          <div className="flex gap-3 mt-2">
            <a href="/dashboard/avvisi" className="underline text-blue-600">Gestisci Avvisi</a>
            <a href="/dashboard/avvisi-citta" className="underline text-blue-600">Avvisi Città</a>
          </div>
        </section>
      </div>
    </div>
  );
}
