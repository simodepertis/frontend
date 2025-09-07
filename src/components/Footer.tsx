export default function Footer() {
  return (
    <footer className="w-full bg-blue-800 text-white py-8 px-4 mt-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between gap-6">
        <div>
          <div className="text-2xl font-bold mb-2 tracking-wide">Incontriescort.org</div>
          <ul className="space-y-1 text-base">
            <li>Nuove Escort</li>
            <li>Escorts indipendenti</li>
            <li>Tours</li>
            <li>Sugardaddy</li>
            <li>Instant Book</li>
            <li>Ragazza del mese</li>
          </ul>
        </div>
        <div className="text-xs md:text-sm flex-1 flex flex-col justify-end md:items-end mt-6 md:mt-0">
          <div className="mb-2">Incontriescort.org © 2025</div>
          <div className="mb-2">
            <a href="#" className="underline hover:text-blue-200">Termini e Condizioni</a> ,{' '}
            <a href="#" className="underline hover:text-blue-200">Politica sulla Privacy</a> ,{' '}
            <a href="#" className="underline hover:text-blue-200">Gestione dei Cookie</a>
          </div>
          <div className="mb-2">Tutte le escorts avevano 18 anni al momento dell'inserimento dell'annuncio.</div>
        </div>
      </div>
    </footer>
  );
}
