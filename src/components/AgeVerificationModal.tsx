"use client";

import { useEffect, useState } from "react";

export default function AgeVerificationModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Controlla se l'utente ha già accettato
    const hasAccepted = localStorage.getItem('age-verification-accepted');
    if (!hasAccepted) {
      setIsVisible(true);
      // Blocca lo scroll del body
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('age-verification-accepted', 'true');
    setIsVisible(false);
    document.body.style.overflow = 'unset';
  };

  const handleExit = () => {
    // Reindirizza a Google o chiude la finestra
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Solo per adulti !</h2>
        
        <div className="text-gray-700 text-sm space-y-4 mb-6">
          <p>
            <strong>EscortForumit.xxx</strong> – questo sito contiene immagini, video, chat e recensioni di natura erotica e con espliciti 
            riferimenti a prestazioni di carattere sessuale e, pertanto, il sito è severamente vietato ai minori di anni 18.
          </p>
          
          <p>
            Stai per entrare in una sezione di questo sito web severamente vietata ai minori di anni 18 che raggruppa siti web che 
            contengono immagini, trattano argomenti ed usano un linguaggio destinato esclusivamente ad un pubblico adulto.
          </p>
          
          <p>
            Se non sei maggiorenne esci immediatamente da questo sito cliccando sul pulsante <strong>"ESCI DA QUESTO SITO"</strong>. 
            Proseguendo con la navigazione in questa sezione del sito dichiari espressamente di accettare quanto segue:
          </p>
          
          <ul className="list-disc ml-6 space-y-2">
            <li>Dichiaro di essere una persona maggiorenne di età in relazione alla legge del paese in cui vivo;</li>
            <li>
              Dichiaro che le immagini e gli argomenti presenti su questa sezione del sito che hanno un carattere esplicitamente 
              sessuale non offendono la mia persona e accetto consapevolmente di visionarli;
            </li>
            <li>
              Dichiaro quanto espresso ai due punti precedenti mi assumo ogni tipo di responsabilità in relazione alla veridicità 
              delle mie dichiarazioni e contestualmente manlevò l'Amministrazione del sito web da qualsiasi tipo di responsabilità civile 
              e/o penale.
            </li>
          </ul>
          
          <p>
            L'Amministrazione del sito web dichiara che tutto il materiale presente in questa sezione del sito è stato ricevuto da parte 
            delle inserzioni e degli inserzionisti via web e i titolari del diritto di immagine, con la pubblicazione, hanno acconsentito a 
            che tale materiale divenni di dominio pubblico sotto la loro diretta responsabilità civile e penale.
          </p>
          
          <p>
            Laddove il materiale pubblicato – nonostante la costante e quotidiana azione di controllo da parte degli incaricati del sito web 
            – dovesse risultare offensivo per la dignità personale e/o professionale di alcuno o dovesse urtare la sensibilità di terzi che 
            possano avere interesse nella titolarità dei diritto di immagine, si prega di segnalare tempestivamente tale violazione a 
            mezzo mail in modo da permettere all'Amministrazione del sito di intervenire tempestivamente a tutela degli eventuali 
            interessati.
          </p>
          
          <p>
            Si precisa che tutto il materiale foto, video e scritto presente all'interno del sito web è stato attentamente controllato e 
            certificato come autentico e non contrario alla legge vigente sul territorio nazionale tuttavia se parte – anche minima – del 
            citato materiale possa destare anche solo lievi dubbi di violazione della normativa in materia di pedo-pornografia, si invitano 
            tutti gli utenti a darne tempestiva comunicazione all'Amministrazione del sito in modo da permettere l'immediata rimozione 
            del materiale erroneamente pubblicato e la successiva denuncia alle competenti Autorità di Polizia.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleExit}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Esci da questo sito
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Sono d'accordo
          </button>
        </div>
      </div>
    </div>
  );
}
