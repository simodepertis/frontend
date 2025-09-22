"use client";

import SectionHeader from "@/components/SectionHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SupportoPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    setSubject(""); setMessage("");
    setOkMsg("Ticket inviato. Ti risponderemo via email.");
  };
  return (
    <div className="space-y-6">
      <SectionHeader title="Supporto" subtitle="Contatta l'assistenza o consulta le FAQ" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-3 text-white">FAQ</h3>
        <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
          <li>Non riesco ad accedere: assicurati che email e password siano corrette. Puoi reimpostarla dalla pagina di login.</li>
          <li>Come cambio email? Modifica da "Il Mio Profilo" e salva.</li>
          <li>Come ricevo notifiche per città? Vai su "Avvisi" e "Avvisi Città".</li>
        </ul>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-3 text-white">Contatti</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <div>Email: support@incontriescort.org</div>
          <div>Chat: Lun–Ven 9–18</div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-3 text-white">Apri un Ticket</h3>
        {okMsg && (
          <div className="mb-3 rounded-md border border-green-700 bg-green-900/40 text-green-200 px-3 py-2">{okMsg}</div>
        )}
        <form onSubmit={send} className="grid gap-3 max-w-xl">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Oggetto" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" required />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descrivi il problema" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 h-28" required />
          <Button type="submit">Invia</Button>
        </form>
      </div>
    </div>
  );
}
