export default function Footer() {
  return (
    // Stile coerente con la barra secondaria dell'header
    <footer className="w-full bg-gray-900 border-t border-gray-800 text-gray-300">
      <div className="container mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        
        {/* Colonna 1: Logo e Copyright */}
        <div className="flex flex-col items-center md:items-start">
          <div className="text-xl font-bold mb-2 tracking-wide text-white">Incontriescort.org</div>
          <p className="text-gray-400"> 2025 Tutti i diritti riservati.</p>
        </div>

        {/* Colonna 2: Legale e Note */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <div className="flex gap-4 mb-3">
            <a href="/termini" className="text-gray-400 hover:text-white transition-colors">Termini</a>
            <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="/cookie" className="text-gray-400 hover:text-white transition-colors">Cookie</a>
          </div>
          <p className="text-xs text-gray-500">Tutte le escorts avevano 18 anni al momento dell'inserimento dell'annuncio.</p>
        </div>
        
      </div>
    </footer>
  );
}