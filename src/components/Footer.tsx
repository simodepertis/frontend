export default function Footer() {
  return (
    // Stile coerente con la barra secondaria dell'header
    <footer className="w-full bg-neutral-100 border-t text-neutral-600">
      <div className="container mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        
        {/* Colonna 1: Logo e Copyright */}
        <div className="flex flex-col items-center md:items-start">
          <div className="text-xl font-bold mb-2 tracking-wide text-black">Incontriescort.org</div>
          <p>© 2025 Tutti i diritti riservati.</p>
        </div>
        
        {/* Colonna 2: Link Utili (da popolare) */}
        <div className="flex flex-col items-center">
          <h4 className="font-bold mb-3 text-black">Link Utili</h4>
          <ul className="space-y-1 text-center">
            <li><a href="#" className="hover:text-red-600">Chi Siamo</a></li>
            <li><a href="#" className="hover:text-red-600">Lavora con Noi</a></li>
            <li><a href="#" className="hover:text-red-600">Supporto</a></li>
          </ul>
        </div>

        {/* Colonna 3: Legale e Note */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <div className="flex gap-4 mb-3">
            <a href="#" className="underline hover:text-black">Termini</a>
            <a href="#" className="underline hover:text-black">Privacy</a>
            <a href="#" className="underline hover:text-black">Cookie</a>
          </div>
          <p className="text-xs">Tutte le escorts avevano 18 anni al momento dell'inserimento dell'annuncio.</p>
        </div>
        
      </div>
    </footer>
  );
}