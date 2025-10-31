# Sistema Recensioni per Incontri Veloci

## Panoramica
Questo sistema collega automaticamente le recensioni di Escort Advisor agli annunci di Incontri Veloci importati da Bakeca.

## Struttura Database

### Modifiche allo Schema
```prisma
model QuickMeeting {
  // ... campi esistenti
  importedReviews ImportedReview[]  // Nuova relazione
}

model ImportedReview {
  // ... campi esistenti
  quickMeetingId Int?
  quickMeeting QuickMeeting? @relation(fields: [quickMeetingId], references: [id])
}
```

## Setup Iniziale

### 1. Aggiornare il Database
```bash
cd c:\Users\Simone\frontend
npx prisma db push
npx prisma generate
```

### 2. Collegare Recensioni Esistenti
```bash
node scripts/link-reviews-to-quickmeetings.js
```

Questo script:
- ✅ Match per **telefono** (priorità massima): 100 punti
- ✅ Match per **WhatsApp**: 100 punti  
- ✅ Similarità **nome**: fino a 50 punti
- ✅ Collega recensione se score ≥ 80

## Workflow Automatico

### 1. Importazione Annunci (Bakeca)
```bash
# Scraper per Bakeca.it - massaggi
node scripts/bakeca-massaggi-fix.js

# Scraper per Bakecaincontrii.com
node scripts/scraper-robusto.js
```

### 2. Importazione Recensioni (Escort Advisor)
```bash
# Lo scraper esistente per recensioni
node scripts/escort-advisor-scraper.js
```

### 3. Collegamento Automatico
```bash
# Ogni volta dopo aver importato nuove recensioni o annunci
node scripts/link-reviews-to-quickmeetings.js
```

## API Endpoints

### GET `/api/quick-meetings`
Lista incontri con filtri
```typescript
Query params:
- category?: 'DONNA_CERCA_UOMO' | 'TRANS' | 'UOMO_CERCA_UOMO' | 'CENTRO_MASSAGGI'
- city?: string
- limit?: number (default: 20)
- page?: number (default: 1)

Response:
{
  meetings: QuickMeeting[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    pages: number
  }
}
```

### GET `/api/quick-meetings/[id]`
Dettaglio incontro con recensioni
```typescript
Response:
{
  meeting: {
    ...QuickMeeting,
    importedReviews: ImportedReview[],
    reviewCount: number
  }
}
```

### POST `/api/quick-meetings/[id]/view`
Incrementa visualizzazioni
```typescript
Response: { success: true }
```

## Frontend

### Pagine
1. **`/incontri-veloci`** - Lista incontri
2. **`/incontri-veloci/[id]`** - Dettaglio con recensioni

### Componente Recensioni
Nella pagina dettaglio (`/incontri-veloci/[id]/page.tsx`):
- ⭐ Mostra tutte le recensioni collegate
- 📊 Rating stelle (1-5)
- 👤 Nome recensore
- 📅 Data recensione
- 📝 Testo recensione
- 🔗 Link alla fonte (Escort Advisor)

## Logica di Matching

### Funzione `normalizePhone()`
```javascript
// Rimuove spazi, trattini, +39, 0039, zeri iniziali
'(+39) 333-1234567' → '3331234567'
'0039 3331234567'   → '3331234567'
```

### Funzione `calculateSimilarity()`
```javascript
// Levenshtein distance per nomi
'Anna Bella'    vs 'Anna'      → 0.8 (contiene)
'Maria Rossi'   vs 'maria'     → 0.8 (contiene)
'Sofia Milano'  vs 'Sofia ML'  → 0.7+ (similare)
```

### Score Minimo
- **80 punti** richiesti per collegamento automatico
- Esempi:
  - ✅ Telefono uguale = 100 → collegato
  - ✅ WhatsApp uguale = 100 → collegato
  - ✅ Nome simile (0.8) = 40, nessun telefono → **non collegato**
  - ✅ Telefono + nome diverso = 100 → collegato

## Manutenzione

### Statistiche
Lo script di collegamento mostra:
```
📊 Trovate 45 recensioni da collegare
📊 Trovati 120 annunci Incontri Veloci attivi

✅ Collegata recensione "Sofia" → "Sofia Massaggi" (score: 100.0)
⏭️  Recensione "Anna" - nessun match trovato (best score: 35.0)

============================================================
✅ Collegamento completato!
   • Recensioni collegate: 38
   • Recensioni saltate: 7
============================================================

📊 Top 10 annunci con più recensioni:
   1. "Sofia Massaggi Centro" - 12 recensioni
   2. "Maria Trans" - 8 recensioni
   3. "Giulia Escort" - 5 recensioni
```

### Pulizia Database
```bash
# Rimuovi collegamenti errati
npx prisma studio
# Apri ImportedReview, filtra per quickMeetingId != null
# Modifica manualmente se necessario
```

### Re-linking
```bash
# Resetta tutti i collegamenti e rifai il match
npx prisma studio
# 1. Apri ImportedReview
# 2. Seleziona tutti con quickMeetingId != null
# 3. Setta quickMeetingId = null
# 4. Rilancia: node scripts/link-reviews-to-quickmeetings.js
```

## Troubleshooting

### Problema: Recensioni non appaiono
```bash
# 1. Verifica collegamento
npx prisma studio → ImportedReview → cerca per quickMeetingId

# 2. Verifica API
curl http://localhost:3000/api/quick-meetings/1

# 3. Verifica frontend console
# Apri DevTools → Console → cerca errori
```

### Problema: Prisma Client non aggiornato
```bash
npx prisma generate
```

### Problema: TypeScript errors
```bash
# Dopo modifiche schema, sempre:
npx prisma generate
# Poi riavvia dev server
npm run dev
```

## Prossimi Passi

### 1. Automazione Completa
Creare un cron job che ogni ora:
```javascript
// scripts/sync-all.js
1. Scrape Bakeca → importa annunci
2. Scrape Escort Advisor → importa recensioni
3. Link reviews to meetings → collega
4. Cleanup expired → rimuovi annunci scaduti
```

### 2. Miglioramenti Matching
- [ ] Fuzzy matching più intelligente (Soundex, Metaphone)
- [ ] ML per suggerire collegamenti dubbi
- [ ] Dashboard admin per approvare match suggeriti

### 3. Frontend
- [ ] Badge "Verificato" per annunci con recensioni
- [ ] Filtro "Con recensioni"
- [ ] Rating medio nella lista
- [ ] Ordinamento per rating

## File Modificati/Creati

### Schema
- ✅ `prisma/schema.prisma`

### Scripts
- ✅ `scripts/link-reviews-to-quickmeetings.js`

### API
- ✅ `src/pages/api/quick-meetings/index.ts`
- ✅ `src/pages/api/quick-meetings/[id].ts`
- ✅ `src/pages/api/quick-meetings/[id]/view.ts`

### Frontend
- ✅ `src/app/incontri-veloci/[id]/page.tsx`

## Checklist Deploy

Prima di andare in produzione:
- [ ] `npx prisma db push` (aggiorna schema)
- [ ] `npx prisma generate` (genera client)
- [ ] `node scripts/link-reviews-to-quickmeetings.js` (collega esistenti)
- [ ] Test API endpoints
- [ ] Test frontend recensioni
- [ ] Verifica immagini caricano correttamente
- [ ] Setup cron per sync automatico
