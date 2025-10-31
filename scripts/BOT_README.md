# 🤖 Bot Incontri Veloci - Guida Uso

## Bot disponibili

### 1. Bot Bakecaincontri
Importa annunci da bakecaincontri.com (Donna cerca Uomo, Trans, Uomo cerca Uomo)

**Uso:**
```powershell
# Windows PowerShell
$env:USER_ID=1; $env:CATEGORY="DONNA_CERCA_UOMO"; $env:CITY="Milano"; $env:LIMIT=10; node scripts/bot-bakecaincontri.js

# Altre categorie disponibili:
# - DONNA_CERCA_UOMO
# - TRANS
# - UOMO_CERCA_UOMO
```

### 2. Bot Bakeca Massaggi
Importa annunci massaggi da bakeca.it

**Uso:**
```powershell
# Windows PowerShell
$env:USER_ID=1; $env:CITY="Milano"; $env:LIMIT=10; node scripts/bot-bakeca-massaggi.js
```

## Parametri comuni

- **USER_ID** (obbligatorio): ID dell'utente a cui assegnare gli annunci
- **CITY** (opzionale, default: Milano): Città target
- **LIMIT** (opzionale, default: 20): Numero massimo di annunci da importare

## Come trovare USER_ID

1. Apri `http://localhost:3000/dashboard`
2. Apri la console del browser (F12)
3. Esegui:
```js
fetch('/api/user/me').then(r=>r.json()).then(d=>console.log('USER_ID:', d.user.id))
```

## Cosa fanno i bot

1. Scaricano la lista degli annunci dal sito target
2. Per ogni annuncio:
   - Estraggono: titolo, descrizione, foto, telefono, WhatsApp, età
   - Controllano se esiste già (dedup per sourceId)
   - Salvano in QuickMeeting con userId specificato
   - Annuncio diventa subito visibile in "Incontri Veloci"

## Dove appaiono gli annunci importati

- Dashboard utente: `/dashboard/incontri-veloci`
- Pagina pubblica: `/incontri-veloci` (filtrabili per categoria e città)

## Troubleshooting

### "USER_ID richiesto"
Devi specificare USER_ID. Esempio:
```powershell
$env:USER_ID=1; node scripts/bot-bakecaincontri.js
```

### "Nessun annuncio trovato"
- Verifica la connessione internet
- Il sito potrebbe avere cambiato layout
- Prova senza specificare città (usa solo categoria base)

### "Già esistente"
L'annuncio è già stato importato in precedenza (normale, viene skippato)

### 3. Scheduler BUMP
Fa risalire automaticamente gli annunci in prima pagina nelle fasce orarie scelte

**Uso:**
```powershell
# Windows PowerShell
node scripts/bump-scheduler.js
```

**Come funziona:**
- Gira in loop ogni minuto
- Controlla annunci con `nextBumpAt <= ORA_CORRENTE`
- Aggiorna `publishedAt = ORA_CORRENTE` → annuncio risale in prima pagina
- Decrementa `bumpsRemaining`
- Calcola `nextBumpAt` successivo in base a pacchetto e fascia

**Pacchetti supportati:**
- **1+1**: 2 giorni, 1 bump (totale 2 risalite)
- **1+3**: 4 giorni, 3 bump (totale 4 risalite)
- **1+7**: 8 giorni, 7 bump (totale 8 risalite)
- **1x10**: 10 risalite notturne casuali (00:00-08:00)
- **1x3**: 3 risalite notturne casuali (00:00-08:00)

**Fasce orarie diurne:**
08:00-09:00, 09:00-10:00, 10:00-11:00, 11:00-12:00, 12:00-13:00, 13:00-14:00, 14:00-15:00, 15:00-16:00, 16:00-17:00, 17:00-18:00, 18:00-19:00, 19:00-20:00, 20:00-21:00, 21:00-22:00, 22:00-23:00, 23:00-00:00

**Fasce orarie notturne:**
00:00-08:00 (orario casuale)

**Per assegnare pacchetto BUMP a un annuncio:**
Vai in dashboard → Incontri Veloci → Modifica annuncio → Seleziona pacchetto e fascia

### 4. Bot Escort Advisor
Importa recensioni da escort-advisor.com e crea profili QuickMeeting

**Uso:**
```powershell
# Windows PowerShell
$env:LIMIT=50; node scripts/bot-escort-advisor.js
```

**Cosa fa:**
1. Scarica recensioni da escort-advisor.com
2. Per ogni recensione:
   - Cerca QuickMeeting per telefono o nome
   - Se non esiste, crea nuovo profilo in categoria corretta (Donna/Trans/Uomo)
   - Salva recensione in ImportedReview
   - Collega recensione al profilo

**Categorie automatiche:**
- Rileva "trans" nel testo → categoria TRANS
- Rileva "gay/uomo/ragazzo" → categoria UOMO_CERCA_UOMO
- Default → categoria DONNA_CERCA_UOMO

## Sistema completo funzionante

### Setup iniziale
```powershell
# 1. Installa dipendenze (se non l'hai già fatto)
npm install

# 2. Genera Prisma Client
npx prisma generate
```

### Flusso di lavoro consigliato

**1. Importa annunci**
```powershell
# Donna cerca Uomo Milano
$env:USER_ID=1; $env:CATEGORY="DONNA_CERCA_UOMO"; $env:CITY="Milano"; $env:LIMIT=20; node scripts/bot-bakecaincontri.js

# Trans Milano
$env:USER_ID=1; $env:CATEGORY="TRANS"; $env:CITY="Milano"; $env:LIMIT=20; node scripts/bot-bakecaincontri.js

# Centro Massaggi Milano
$env:USER_ID=1; $env:CITY="Milano"; $env:LIMIT=20; node scripts/bot-bakeca-massaggi.js
```

**2. Importa recensioni**
```powershell
$env:LIMIT=50; node scripts/bot-escort-advisor.js
```

**3. Avvia scheduler BUMP** (in una finestra separata)
```powershell
node scripts/bump-scheduler.js
```

**4. Assegna pacchetti BUMP agli annunci**
- Vai su `/dashboard/incontri-veloci`
- Modifica annuncio
- Seleziona pacchetto (1+1, 1+3, 1+7, 1x10, 1x3)
- Seleziona fascia oraria (per pacchetti diurni)
- Salva

Lo scheduler farà risalire automaticamente gli annunci nelle fasce scelte!

## Note importanti

- **Bot sono autonomi**: non servono API key o login
- **Scheduler gira in background**: mantienilo attivo per bump automatici
- **Deduplicazione automatica**: gli annunci già importati vengono skippati
- **Profili bot**: Escort Advisor crea profili senza userId (visibili ma non modificabili da utenti)
