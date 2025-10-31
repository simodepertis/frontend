# Sistema Incontri Veloci - Guida Completa

## 🎯 Panoramica

Sistema completo per gestire annunci "Incontri Veloci" con due modalità:
1. **Bot Scraper**: Importa automaticamente da Bakecaincontrii.com (userId = null)
2. **Form Profilo**: Escort possono creare manualmente i loro annunci (userId = ID escort)

---

## 📦 Setup Database

### Step 1: Aggiorna Schema
Lo schema è già modificato in `prisma/schema.prisma`:
- Aggiunto campo `userId` (opzionale) in `QuickMeeting`
- Relazione con `User`
- Relazione con `ImportedReview` per recensioni Escort Advisor

### Step 2: Applica Modifiche
```powershell
cd c:\Users\Simone\frontend

# Aggiorna database
npx prisma db push

# Genera Prisma Client
npx prisma generate
```

---

## 🤖 Bot Scraper Migliorato

### File: `scripts/bakeca-scraper-completo.js`

#### Cosa Estrae:
- ✅ Titolo completo
- ✅ Descrizione completa
- ✅ Telefono (da link tel: o testo)
- ✅ WhatsApp (da link wa.me)
- ✅ Età (pattern regex)
- ✅ Prezzo (da elementi price)
- ✅ Zona/Quartiere
- ✅ **TUTTE le foto** (non solo prima)
- ✅ Categoria (DONNA_CERCA_UOMO, TRANS, UOMO_CERCA_UOMO)
- ✅ Città

#### Come Funziona:
1. Naviga sulla lista annunci
2. Estrae link a dettagli
3. Visita ogni dettaglio
4. Estrae dati completi con selettori multipli
5. Salva in DB con `userId = null`

#### Esecuzione:
```powershell
node scripts/bakeca-scraper-completo.js
```

#### Output Atteso:
```
🚀 Avvio Bakeca Scraper Completo...

============================================================
📂 Categoria: DONNA_CERCA_UOMO
🌐 URL: https://www.bakecaincontrii.com/escort/milano/
============================================================

✅ Trovati 47 link annunci

[1/30] 🔍 Analisi: https://...
   ✅ Salvato: "Bellissima Sofia, 25 anni"

[2/30] 🔍 Analisi: https://...
   ✅ Salvato: "Maria - Centro Massaggi"

...

✅ Completato: 28/30 annunci salvati

🎉 Scraping completato!
📊 Totale annunci importati dal bot: 84
```

---

## 👤 Form Profilo Escort

### Pagine Create:

#### 1. `/dashboard/incontri-veloci` - Lista annunci
- Lista tutti gli annunci creati dall'escort
- Bottone "Crea Nuovo"
- Azioni: Modifica, Disattiva, Elimina, Anteprima

#### 2. `/dashboard/incontri-veloci/nuovo` - Creazione
**Step 1 - Dati Annuncio:**
- 📂 Categoria (dropdown)
- 🌍 Città (dropdown)
- 📍 Indirizzo (opzionale)
- 📮 CAP (opzionale)
- 🏘️ Zona/Quartiere (opzionale)
- 🎂 Età
- 🎭 Nome d'arte (max 20 caratteri)
- 📝 Titolo (min 5 caratteri)
- 💬 Descrizione (min 20 caratteri)
- 📞 Telefono (obbligatorio)
- 💬 WhatsApp (checkbox)

**Step 2 - Foto:**
- Upload multiplo
- Anteprima galleria
- Rimozione foto

### API Endpoints:

#### `GET /api/dashboard/quick-meetings`
Lista annunci dell'escort loggata
```typescript
Headers: Cookie con session
Response: { meetings: QuickMeeting[] }
```

#### `POST /api/dashboard/quick-meetings`
Crea nuovo annuncio
```typescript
Headers: Cookie con session
Body: {
  title: string,
  description: string,
  category: QuickMeetingCategory,
  city: string,
  zone?: string,
  phone: string,
  whatsapp?: string,
  age?: number,
  photos: string[],
  expiresAt: Date
}
Response: { meeting: QuickMeeting }
```

#### `DELETE /api/dashboard/quick-meetings/[id]`
Elimina annuncio (solo proprio)

#### `PATCH /api/dashboard/quick-meetings/[id]/toggle`
Attiva/disattiva annuncio

---

## 🔄 Workflow Completo

### 1. Prima Volta - Setup
```powershell
# Database
npx prisma db push
npx prisma generate

# Avvia dev server
npm run dev
```

### 2. Bot Import (ogni giorno)
```powershell
# Importa annunci da Bakeca
node scripts/bakeca-scraper-completo.js

# Collega recensioni Escort Advisor
node scripts/link-reviews-to-quickmeetings.js
```

### 3. Escort Manuale
1. Login su sito
2. Vai `/dashboard/incontri-veloci`
3. Clicca "Crea Nuovo Annuncio"
4. Compila Step 1 → Prosegui
5. Carica foto Step 2 → Pubblica

---

## 📊 Database Structure

### Tabella `QuickMeeting`
```prisma
model QuickMeeting {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  category    QuickMeetingCategory
  city        String
  zone        String?
  phone       String?
  whatsapp    String?
  age         Int?
  price       Int?
  photos      Json     // array di URL
  isActive    Boolean  @default(true)
  
  // Bot vs Manual
  userId      Int?     // null = bot, non-null = escort
  sourceUrl   String?  // URL origine Bakeca
  sourceId    String?  // ID unico per dedup
  
  // Relazioni
  user        User?    @relation(fields: [userId], references: [id])
  importedReviews ImportedReview[]
  
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Distinzione Bot vs Manual
```sql
-- Annunci importati da bot
SELECT * FROM QuickMeeting WHERE userId IS NULL;

-- Annunci creati da escort
SELECT * FROM QuickMeeting WHERE userId IS NOT NULL;

-- Annunci di una specifica escort
SELECT * FROM QuickMeeting WHERE userId = 123;
```

---

## 🧪 Testing

### 1. Test Bot Scraper
```powershell
# Esegui scraper
node scripts/bakeca-scraper-completo.js

# Verifica in Prisma Studio
npx prisma studio
# → QuickMeeting → filtra userId = null
```

### 2. Test Form Profilo
1. Login come escort
2. Vai `http://localhost:3000/dashboard/incontri-veloci`
3. Clicca "Crea Nuovo Annuncio"
4. Compila form → Prosegui → Carica foto → Pubblica
5. Verifica in lista e su `http://localhost:3000/incontri-veloci`

### 3. Test Recensioni
```powershell
# Importa recensioni Escort Advisor (se non fatto)
node scripts/escort-advisor-scraper.js

# Collega recensioni ad annunci
node scripts/link-reviews-to-quickmeetings.js

# Verifica: apri dettaglio annuncio
# → Dovresti vedere sezione "⭐ Recensioni (N)"
```

---

## 🚨 Troubleshooting

### Errore: "Cannot find module '@prisma/client'"
```powershell
npx prisma generate
```

### Errore: "EPERM" durante prisma db push
1. Chiudi VSCode
2. Riapri
3. Rilancia `npx prisma db push`

### Errore: "Property 'quickMeetings' does not exist on type 'User'"
```powershell
npx prisma generate
# Poi riavvia dev server
npm run dev
```

### Bot non trova annunci
1. Apri scraper con `headless: false`
2. Verifica visualmente cookie banner
3. Controlla selettori in console browser

### Form non salva
1. Verifica autenticazione: `console.log(session)` nell'API
2. Controlla console browser per errori
3. Verifica validazione campi obbligatori

---

## 📈 Statistiche

### Query Utili

```sql
-- Totale annunci
SELECT COUNT(*) FROM QuickMeeting;

-- Per fonte
SELECT 
  CASE WHEN userId IS NULL THEN 'Bot' ELSE 'Manual' END as source,
  COUNT(*) as total
FROM QuickMeeting
GROUP BY source;

-- Per categoria
SELECT category, COUNT(*) as total
FROM QuickMeeting
GROUP BY category;

-- Top escort per numero annunci
SELECT 
  u.nome,
  COUNT(qm.id) as annunci_count
FROM User u
JOIN QuickMeeting qm ON qm.userId = u.id
GROUP BY u.id
ORDER BY annunci_count DESC
LIMIT 10;

-- Annunci con recensioni
SELECT 
  qm.title,
  COUNT(ir.id) as recensioni_count
FROM QuickMeeting qm
LEFT JOIN ImportedReview ir ON ir.quickMeetingId = qm.id
GROUP BY qm.id
HAVING recensioni_count > 0
ORDER BY recensioni_count DESC;
```

---

## 🔐 Sicurezza

### Controlli Implementati:
- ✅ Autenticazione richiesta per dashboard
- ✅ Escort può modificare/eliminare solo PROPRI annunci
- ✅ Validazione campi obbligatori
- ✅ Sanitizzazione telefono/email
- ✅ Limite upload foto

### Da Implementare (Produzione):
- [ ] Rate limiting su API
- [ ] Validazione email/telefono formato
- [ ] Moderazione annunci (admin approval)
- [ ] Report annunci sospetti
- [ ] CAPTCHA su form pubblico

---

## 📁 File Creati/Modificati

### Database
- ✅ `prisma/schema.prisma` (aggiunto userId, relazioni)

### Scripts
- ✅ `scripts/bakeca-scraper-completo.js` (scraper migliorato)
- ✅ `scripts/link-reviews-to-quickmeetings.js` (collegamento recensioni)

### Frontend - Dashboard
- ✅ `src/app/dashboard/incontri-veloci/page.tsx` (lista)
- ✅ `src/app/dashboard/incontri-veloci/nuovo/page.tsx` (form multi-step)

### API
- ✅ `src/pages/api/dashboard/quick-meetings/index.ts` (GET, POST)
- ✅ `src/pages/api/dashboard/quick-meetings/[id].ts` (GET, PATCH, DELETE)
- ✅ `src/pages/api/dashboard/quick-meetings/[id]/toggle.ts` (attiva/disattiva)
- ✅ `src/pages/api/quick-meetings/[id].ts` (dettaglio pubblico con recensioni)
- ✅ `src/pages/api/quick-meetings/index.ts` (lista pubblica)
- ✅ `src/pages/api/quick-meetings/[id]/view.ts` (incrementa views)

### Frontend - Pubblico
- ✅ `src/app/incontri-veloci/page.tsx` (lista pubblica)
- ✅ `src/app/incontri-veloci/[id]/page.tsx` (dettaglio con recensioni)

---

## ✅ Checklist Deploy

Prima di andare in produzione:

### Database
- [ ] `npx prisma db push` (applica schema)
- [ ] `npx prisma generate` (genera client)
- [ ] Backup database esistente

### Scraper
- [ ] Test scraper su tutte categorie
- [ ] Verifica estrazione completa dati
- [ ] Setup cron job (es: ogni 6 ore)

### Frontend
- [ ] Test login/logout
- [ ] Test creazione annuncio
- [ ] Test modifica/eliminazione
- [ ] Test upload foto
- [ ] Test attiva/disattiva

### SEO & Performance
- [ ] Meta tags su pagine pubbliche
- [ ] Sitemap include /incontri-veloci
- [ ] Lazy loading immagini
- [ ] CDN per foto

### Legale
- [ ] Termini & Condizioni aggiornati
- [ ] Privacy Policy (dati annunci)
- [ ] Disclaimer responsabilità incontri
- [ ] Moderazione contenuti

---

## 🎉 Done!

Tutto pronto! Ora puoi:
1. Eseguire `npx prisma db push`
2. Lanciare scraper: `node scripts/bakeca-scraper-completo.js`
3. Testare form su `/dashboard/incontri-veloci`
4. Vedere annunci su `/incontri-veloci`

**Buon lavoro! 🚀**
