export const metadata = {
  title: "Consenso legale all'utilizzo di immagini e video",
  description: "Documento ufficiale (PDF) da leggere e accettare.",
};

export default function ConsensoLegalePage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Consenso legale all'utilizzo di immagini e video</h1>
      <p className="text-sm text-neutral-700 mb-4">
        Qui sotto trovi il documento ufficiale in formato PDF. Se il browser non lo visualizza, usa il link diretto.
      </p>

      <div className="w-full border rounded-lg overflow-hidden" style={{height: "80vh"}}>
        <object data="/docs/liberatoria.pdf" type="application/pdf" width="100%" height="100%">
          <p className="p-4">
            Il PDF non può essere visualizzato dal tuo browser. Puoi scaricarlo da qui:
            {" "}
            <a className="text-blue-600 underline" href="/docs/liberatoria.pdf" target="_blank" rel="noopener noreferrer">scarica la liberatoria (PDF)</a>.
          </p>
        </object>
      </div>

      <div className="mt-4 text-sm text-neutral-600">
        Link diretto: {" "}
        <a className="text-blue-600 underline" href="/docs/liberatoria.pdf" target="_blank" rel="noopener noreferrer">/docs/liberatoria.pdf</a>
      </div>
    </main>
  );
}
