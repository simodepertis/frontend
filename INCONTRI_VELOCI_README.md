# 🚀 Sistema Incontri Veloci - IncontriEscort.org

Sistema completo di scraping, gestione annunci e bump automatico per la sezione "Incontri Veloci".

## 📋 Panoramica

Il sistema implementa:

1. **Bot Scraping Recensioni** da escort-advisor.com
2. **Bot Scraping Annunci** da bakecaincontri.com e bakeca.it
3. **Sistema Bump Automatico** con fasce orarie
4. **Sezione Web "Incontri Veloci"** con filtri e ricerca

## 🗄️ Database

### Nuove Tabelle

- **`QuickMeeting`**: Annunci incontri veloci
- **`ImportedReview`**: Recensioni importate da escort-advisor
- **`BumpLog`**: Log dei bump automatici

### Categorie Supportate

- `DONNA_CERCA_UOMO` - Donna cerca Uomo
- `TRANS` - Trans
- `UOMO_CERCA_UOMO` - Uomo cerca Uomo  
- `CENTRO_MASSAGGI` - Centro Massaggi

## ⚡ Sistema Bump

### Pacchetti Diurni
- **1+1**: 2 giorni di bump (1 iniziale + 1 aggiuntivo)
- **1+3**: 4 giorni di bump (1 iniziale + 3 aggiuntivi)
- **1+7**: 8 giorni di bump (1 iniziale + 7 aggiuntivi)

### Pacchetti Notturni (00:00-08:00)
- **1x10**: 10 bump durante la notte
- **1x3**: 3 bump durante la notte

### Fasce Orarie
```
08:00-09:00, 09:00-10:00, 10:00-11:00, 11:00-12:00
12:00-13:00, 13:00-14:00, 14:00-15:00, 15:00-16:00
16:00-17:00, 17:00-18:00, 18:00-19:00, 19:00-20:00
20:00-21:00, 21:00-22:00, 22:00-23:00, 23:00-00:00
```

## 🤖 Bot di Scraping

### 1. Escort Advisor Bot
**File**: `scripts/escort-advisor-scraper.js`

**Funzioni**:
- Scraping recensioni da escort-advisor.com
- Matching automatico con escort esistenti
- Auto-approvazione recensioni importate

**Utilizzo**:
```bash
cd scripts
npm run escort-advisor
```

### 2. Bakeca Bot
**File**: `scripts/bakeca-scraper.js`

**Funzioni**:
- Scraping da bakecaincontri.com (Donna cerca uomo, Trans, Uomo cerca uomo)
- Scraping da bakeca.it/massaggi-benessere (Centro massaggi)
- Assegnazione automatica pacchetti bump
- Gestione foto multiple

**Utilizzo**:
```bash
cd scripts
npm run bakeca
```

## 🔄 Sistema Bump Automatico

**File**: `scripts/auto-bump-system.js`

**Funzioni**:
- Controllo ogni 15 minuti per bump da eseguire
- Rispetto fasce orarie assegnate
- Pulizia automatica annunci scaduti
- Statistiche e monitoraggio

**Utilizzo**:
```bash
# Esecuzione singola
cd scripts
npm run bump-once

# Modalità daemon (24/7)
cd scripts
npm run bump-daemon
```

## 🌐 Interfaccia Web

### Pagina Principale
**URL**: `/incontri-veloci`

**Caratteristiche**:
- Filtri per categoria e città
- Statistiche in tempo reale
- Cards con foto e informazioni
- Badge pacchetti bump attivi

### Pagina Dettaglio
**URL**: `/incontri-veloci/[id]`

**Caratteristiche**:
- Galleria foto completa
- Informazioni dettagliate
- Pulsanti contatto (telefono, WhatsApp, Telegram)
- Contatore visualizzazioni
- Annunci correlati

## 📡 API Endpoints

### Pubbliche
- `GET /api/quick-meetings` - Lista annunci con filtri
- `GET /api/quick-meetings/[id]` - Dettaglio singolo annuncio
- `POST /api/quick-meetings/[id]/view` - Incrementa visualizzazioni

### Debug
- `GET /api/debug/check-cities` - Verifica struttura dati cities

## 🛠️ Setup e Installazione

### 1. Preparazione Database
```bash
# Aggiorna schema Prisma
npx prisma db push

# Genera client
npx prisma generate
```

### 2. Installazione Bot
```bash
cd scripts
npm install
```

### 3. Avvio Sistema
```bash
# 1. Avvia sito web
npm run dev

# 2. Avvia bump daemon (in un altro terminale)
cd scripts
npm run bump-daemon

# 3. Esegui scraping iniziale (opzionale)
npm run bakeca
npm run escort-advisor
```

## 📊 Monitoraggio

### Log Bump System
Il daemon mostra:
- Annunci processati ogni 15 minuti
- Errori e retry
- Statistiche ogni 6 ore
- Pulizia annunci scaduti

### Statistiche Database
```bash
# Conta annunci per categoria
SELECT category, COUNT(*) FROM "QuickMeeting" WHERE "isActive" = true GROUP BY category;

# Bump logs ultime 24h
SELECT success, COUNT(*) FROM "BumpLog" WHERE "bumpedAt" > NOW() - INTERVAL '24 hours' GROUP BY success;
```

## 🔧 Configurazione

### Variabili Ambiente
```env
DATABASE_URL="postgresql://..."
```

### Personalizzazioni
- **Città target**: Modifica array `cities` nei bot
- **Limiti scraping**: Cambia parametro `limit` nelle chiamate
- **Frequenza bump**: Modifica cron schedule in `auto-bump-system.js`
- **Fasce orarie**: Personalizza array `timeSlots`

## 🚨 Troubleshooting

### Bot non funziona
1. Verifica connessione database
2. Controlla dipendenze installate
3. Verifica permessi Puppeteer

### Bump non avviene
1. Controlla che daemon sia attivo
2. Verifica fasce orarie corrette
3. Controlla log errori

### Annunci non appaiono
1. Verifica `isActive = true`
2. Controlla `expiresAt > NOW()`
3. Verifica filtri applicati

## 📈 Performance

### Ottimizzazioni Implementate
- Indici database su campi critici
- Paginazione API
- Lazy loading immagini
- Cache query frequenti
- Batch processing bump

### Limiti Raccomandati
- Max 100 annunci per richiesta API
- Max 50 profili per scraping session
- Pausa 2-5 secondi tra richieste scraping
- Cleanup automatico annunci > 30 giorni

## 🔒 Sicurezza

### Scraping Responsabile
- User-Agent realistici
- Pause tra richieste
- Gestione rate limiting
- Rispetto robots.txt

### Validazione Dati
- Sanitizzazione input utente
- Validazione URL e telefoni
- Controllo dimensioni foto
- Prevenzione SQL injection

## 🎯 Roadmap Future

### Miglioramenti Pianificati
1. **Machine Learning** per matching automatico recensioni
2. **API Telegram Bot** per notifiche
3. **Dashboard Admin** per gestione manuale
4. **Integrazione WhatsApp Business**
5. **Sistema di moderazione automatica**
6. **Analytics avanzate** con grafici
7. **Mobile App** dedicata

### Integrazioni Possibili
- **Sistemi di pagamento** per bump premium
- **Geolocalizzazione** avanzata
- **Chat integrata** nel sito
- **Sistema di recensioni** interno
- **Notifiche push** browser

---

## 📞 Supporto

Per problemi o domande:
1. Controlla i log del sistema
2. Verifica la documentazione API
3. Testa con dati di esempio
4. Contatta il team di sviluppo

**Sistema sviluppato per IncontriEscort.org - 2024** 🚀
