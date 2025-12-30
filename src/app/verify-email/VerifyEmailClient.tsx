"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerifyEmailClient() {
  const search = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => search?.get("token") || "", [search]);

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("Verifica in corso...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Token mancante");
        return;
      }

      try {
        const res = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || "Verifica fallita");
        }

        if (cancelled) return;
        setStatus("ok");
        setMessage("Email verificata! Ora puoi accedere.");
      } catch (e: unknown) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Verifica fallita");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="container mx-auto px-4 py-12 flex justify-center">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-md border border-gray-600">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">Conferma email</h1>
        <p className="text-gray-200 text-center mb-6">{message}</p>

        {status === "error" ? (
          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={async () => {
                const email = localStorage.getItem("user-email") || "";
                if (!email) {
                  alert("Inserisci la tua email nella pagina di login e riprova.");
                  router.push("/autenticazione");
                  return;
                }

                const r = await fetch("/api/resend-verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });

                if (r.ok) {
                  alert("Email di verifica reinviata. Controlla la posta.");
                } else {
                  const d = await r.json().catch(() => ({}));
                  alert(d?.error || "Impossibile reinviare l'email");
                }
              }}
            >
              Re-invia email di verifica
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => router.push("/autenticazione")}>
              Vai al login
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => router.push("/autenticazione")}>
            Vai al login
          </Button>
        )}
      </div>
    </main>
  );
}
