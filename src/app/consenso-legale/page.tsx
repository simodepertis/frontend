export const metadata = {
  title: "Consenso legale all'utilizzo di immagini e video",
  description: "Documento ufficiale (PDF) da leggere e accettare.",
};

export default function ConsensoLegalePage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <div className="bg-white rounded-lg border p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-6 text-center text-red-600">CONSENSO LEGALE ALL'UTILIZZO DI IMMAGINI E VIDEO</h1>
        
        <div className="prose prose-sm max-w-none space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold mb-2">⚠️ DOCUMENTO OBBLIGATORIO</p>
            <p className="text-red-700 text-sm">
              Questo consenso è obbligatorio per poter utilizzare il sito. Leggi attentamente tutti i punti prima di accettare.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">LIBERATORIA E CONSENSO ALL'UTILIZZO DI IMMAGINI E VIDEO</h2>
            
            <p className="mb-4">
              Con la presente liberatoria, io sottoscritto/a, maggiorenne e nel pieno delle mie facoltà mentali, 
              <strong> AUTORIZZO ESPRESSAMENTE</strong> l'utilizzo delle mie immagini fotografiche e video 
              caricate sulla piattaforma IncontriEscort.org per le seguenti finalità:
            </p>

            <div className="bg-gray-50 border-l-4 border-red-500 pl-4 py-3 mb-4">
              <h3 className="font-semibold mb-2">FINALITÀ AUTORIZZATE:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Pubblicazione sul sito web IncontriEscort.org</li>
                <li>Promozione dei servizi offerti attraverso la piattaforma</li>
                <li>Utilizzo per scopi pubblicitari e di marketing del sito</li>
                <li>Condivisione sui social media collegati alla piattaforma</li>
                <li>Archiviazione nel database del sito per scopi di sicurezza</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">DICHIARAZIONI E GARANZIE</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✓</span>
                <p className="text-sm">Dichiaro di essere maggiorenne e di avere la piena capacità legale</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✓</span>
                <p className="text-sm">Confermo che le immagini caricate mi ritraggono personalmente</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✓</span>
                <p className="text-sm">Garantisco di essere l'unico titolare dei diritti sulle immagini</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✓</span>
                <p className="text-sm">Accetto che le immagini possano essere utilizzate senza limitazioni temporali</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✓</span>
                <p className="text-sm">Rinuncio a qualsiasi compenso per l'utilizzo delle immagini</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">RESPONSABILITÀ E LIMITAZIONI</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm mb-2">
                <strong>IMPORTANTE:</strong> Con la sottoscrizione di questo consenso, l'utente solleva 
                IncontriEscort.org e i suoi gestori da qualsiasi responsabilità derivante da:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Utilizzo improprio delle immagini da parte di terzi</li>
                <li>Violazioni della privacy non direttamente imputabili alla piattaforma</li>
                <li>Conseguenze derivanti dalla pubblicazione delle immagini</li>
                <li>Utilizzo delle immagini per scopi non autorizzati da parte di utenti esterni</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">DIRITTI DELL'UTENTE</h3>
            <div className="space-y-2 text-sm">
              <p>• <strong>Diritto di revoca:</strong> Puoi revocare questo consenso in qualsiasi momento contattando il supporto</p>
              <p>• <strong>Diritto di cancellazione:</strong> Puoi richiedere la rimozione delle tue immagini dal sito</p>
              <p>• <strong>Diritto di accesso:</strong> Puoi verificare quali tue immagini sono pubblicate</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">CONFORMITÀ NORMATIVA</h3>
            <p className="text-sm text-gray-700">
              Questo consenso è redatto in conformità al Regolamento UE 2016/679 (GDPR) e alla normativa italiana 
              sulla privacy (D.Lgs. 196/2003 e successive modifiche). L'utilizzo delle immagini avverrà nel rispetto 
              della dignità della persona e dei principi di liceità, correttezza e trasparenza.
            </p>
          </section>

          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mt-6">
            <p className="text-red-800 font-semibold text-center">
              ⚠️ ATTENZIONE: L'accettazione di questo consenso è obbligatoria per utilizzare i servizi della piattaforma.
              Senza questo consenso non sarà possibile pubblicare annunci o utilizzare le funzionalità avanzate del sito.
            </p>
          </div>

          <div className="text-center mt-6 pt-4 border-t">
            <p className="text-xs text-gray-500">
              Documento aggiornato il {new Date().toLocaleDateString('it-IT')} - IncontriEscort.org
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
