# 🤖 BOT SISTEMA COMPLETO - ISTRUZIONI CLIENTE

## 📋 COSA SERVE

### 1. Bot Recensioni Escort Advisor
**Da dove**: https://www.escort-advisor.com/recensioni/
**Cosa fa**: Importa recensioni clienti
**Per**: Donna cerca Uomo + Trans + Uomo cerca Uomo
**Se non esiste**: Crea profilo e lo inserisce in "Incontri Veloci"

### 2. Bot Annunci Bakecaincontrii
**Da dove**: 
- https://www.bakecaincontrii.com/donna-cerca-uomo/
- https://www.bakecaincontrii.com/trans/
- https://www.bakecaincontrii.com/gay/

**Cosa fa**: Importa TUTTI gli annunci
**Dove**: Sezione "Incontri Veloci" su incontriescort.org

### 3. Bot Centro Massaggi Bakeca
**Da dove**: https://www.bakeca.it/annunci/massaggi-benessere/
**Cosa fa**: Importa annunci massaggi
**Dove**: Sezione "Incontri Veloci" categoria Centro Massaggi

### 4. Sistema Bump con Fasce Orarie
Ogni annuncio deve avere:

**Pacchetti Diurni**:
- **1+1** = 2 giorni, risale in prima pagina/fila nella fascia scelta
- **1+3** = 4 giorni, risale in prima pagina/fila nella fascia scelta
- **1+7** = 8 giorni, risale in prima pagina/fila nella fascia scelta

**Fasce Orarie**:
- 08:00 - 09:00
- 09:00 - 10:00
- 10:00 - 11:00
- 11:00 - 12:00
- 12:00 - 13:00
- 13:00 - 14:00
- 14:00 - 15:00
- 15:00 - 16:00
- 16:00 - 17:00
- 17:00 - 18:00
- 18:00 - 19:00
- 19:00 - 20:00
- 20:00 - 21:00
- 21:00 - 22:00
- 22:00 - 23:00
- 23:00 - 00:00

**Pacchetti Notturni**:
- **1x10** = Risale 10 volte dalle 00:00 alle 08:00
- **1x3** = Risale 3 volte dalle 00:00 alle 08:00

---

## 🚨 PROBLEMA ATTUALE

**Errore**: "Module not found: Can't resolve 'puppeteer'"

**Causa**: Ho messo il bot dentro l'API Next.js, ma Puppeteer non può girare lì.

**Soluzione**: Bot devono essere script SEPARATI che girano fuori dal server web.

---

## ✅ COSA HO GIÀ FATTO

1. ✅ Pagina "Incontri Veloci" in profilo Escort
2. ✅ Pagina "Incontri Veloci" in profilo Agenzia
3. ✅ Form manuale per creare annunci (come bakecaincontrii)
4. ✅ Database schema con campi bump
5. ❌ Bot non funzionanti (errore puppeteer)

---

## 🔧 COSA DEVO FARE ORA

### Step 1: Rimuovere Puppeteer dall'API
Eliminare `pages/api/dashboard/quick-meetings/import-bakeca.ts`

### Step 2: Creare Bot Separati

**Bot 1: Recensioni Escort Advisor**
`scripts/bot-escort-advisor.js`
- Scrape recensioni
- Cerca escort su database
- Se non esiste → crea in QuickMeeting
- Associa recensioni

**Bot 2: Annunci Bakecaincontrii**
`scripts/bot-bakecaincontrii.js`
- Scrape donna-cerca-uomo, trans, gay
- Estrae: titolo, descrizione, telefono, foto, età, prezzo
- Salva in QuickMeeting
- Assegna pacchetto bump random

**Bot 3: Centro Massaggi Bakeca**
`scripts/bot-bakeca-massaggi.js`
- Scrape bakeca.it/massaggi
- Estrae dati
- Salva in QuickMeeting categoria CENTRO_MASSAGGI

**Bot 4: Sistema Bump**
`scripts/bot-bump.js`
- Controlla ogni minuto gli annunci
- Se è la fascia oraria → bump (publishedAt = NOW)
- Decrementa bumpsRemaining
- Calcola nextBumpAt

### Step 3: Cron Job
Eseguire bot automaticamente:
- Bot recensioni: ogni 6 ore
- Bot annunci: ogni 6 ore
- Bot bump: ogni 1 minuto

---

## 📊 DATABASE SCHEMA NECESSARIO

```prisma
model QuickMeeting {
  // ... campi esistenti
  
  // BUMP SYSTEM
  bumpPackage   String?   // "1+1", "1+3", "1+7", "1x10", "1x3"
  bumpTimeSlot  String?   // "08:00-09:00", "00:00-08:00", etc
  maxBumps      Int       @default(0)
  bumpsRemaining Int      @default(0)
  nextBumpAt    DateTime?
  lastBumpAt    DateTime?
  
  // LOG
  bumpLogs      BumpLog[]
}

model BumpLog {
  id              Int      @id @default(autoincrement())
  quickMeetingId  Int
  quickMeeting    QuickMeeting @relation(fields: [quickMeetingId], references: [id])
  bumpedAt        DateTime @default(now())
  bumpType        String   // "scheduled", "manual"
}
```

---

## 🎯 PRIORITÀ

1. **URGENTE**: Rimuovere puppeteer dall'API (fix errore)
2. **ALTA**: Creare bot separati
3. **ALTA**: Implementare sistema bump
4. **MEDIA**: Cron job automatico

---

## ❓ DOMANDE PER IL CLIENTE

1. I bot devono girare **automaticamente** o **manualmente**?
2. Gli annunci importati devono essere **anonimi** (userId=null) o **assegnati a un utente**?
3. Il sistema bump deve essere **automatico** o **manuale** (escort sceglie)?
4. Limite annunci per bot? (es: max 100 per run)

---

## 🚀 PROSSIMI STEP

Cosa vuoi che faccia prima?

**OPZIONE A**: Fix errore puppeteer (rimuovo da API)
**OPZIONE B**: Creo bot separati completi
**OPZIONE C**: Implemento sistema bump
**OPZIONE D**: Tutto insieme (più tempo)

Dimmi cosa preferisci!
