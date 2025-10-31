-- Tabella per annunci "Incontri Veloci"
CREATE TABLE "QuickMeeting" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL, -- 'DONNA_CERCA_UOMO', 'TRANS', 'UOMO_CERCA_UOMO', 'CENTRO_MASSAGGI'
  "city" TEXT NOT NULL,
  "zone" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "telegram" TEXT,
  "age" INTEGER,
  "price" INTEGER,
  "photos" TEXT[], -- Array di URL foto
  "isActive" BOOLEAN DEFAULT true,
  "sourceUrl" TEXT, -- URL originale da bakeca/escort-advisor
  "sourceId" TEXT, -- ID originale dal sito sorgente
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "publishedAt" TIMESTAMP DEFAULT NOW(),
  "expiresAt" TIMESTAMP,
  
  -- Sistema di bump
  "bumpPackage" TEXT, -- '1+1', '1+3', '1+7', '1x10', '1x3'
  "bumpTimeSlot" TEXT, -- '08:00-09:00', '09:00-10:00', etc.
  "bumpCount" INTEGER DEFAULT 0,
  "maxBumps" INTEGER DEFAULT 0,
  "lastBumpAt" TIMESTAMP,
  "nextBumpAt" TIMESTAMP,
  
  -- Metadati
  "views" INTEGER DEFAULT 0,
  "clicks" INTEGER DEFAULT 0,
  "reports" INTEGER DEFAULT 0
);

-- Indici per performance
CREATE INDEX "QuickMeeting_category_idx" ON "QuickMeeting"("category");
CREATE INDEX "QuickMeeting_city_idx" ON "QuickMeeting"("city");
CREATE INDEX "QuickMeeting_publishedAt_idx" ON "QuickMeeting"("publishedAt" DESC);
CREATE INDEX "QuickMeeting_nextBumpAt_idx" ON "QuickMeeting"("nextBumpAt");
CREATE INDEX "QuickMeeting_sourceId_idx" ON "QuickMeeting"("sourceId");

-- Tabella per recensioni importate
CREATE TABLE "ImportedReview" (
  "id" SERIAL PRIMARY KEY,
  "escortName" TEXT NOT NULL,
  "escortPhone" TEXT,
  "reviewerName" TEXT,
  "rating" INTEGER, -- 1-5 stelle
  "reviewText" TEXT,
  "reviewDate" TIMESTAMP,
  "sourceUrl" TEXT,
  "sourceId" TEXT UNIQUE,
  "isProcessed" BOOLEAN DEFAULT false,
  "matchedUserId" INTEGER, -- Se abbinata a un utente esistente
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "ImportedReview_escortPhone_idx" ON "ImportedReview"("escortPhone");
CREATE INDEX "ImportedReview_sourceId_idx" ON "ImportedReview"("sourceId");
CREATE INDEX "ImportedReview_isProcessed_idx" ON "ImportedReview"("isProcessed");

-- Tabella per log dei bump automatici
CREATE TABLE "BumpLog" (
  "id" SERIAL PRIMARY KEY,
  "quickMeetingId" INTEGER REFERENCES "QuickMeeting"("id") ON DELETE CASCADE,
  "bumpedAt" TIMESTAMP DEFAULT NOW(),
  "timeSlot" TEXT,
  "success" BOOLEAN DEFAULT true,
  "error" TEXT
);

CREATE INDEX "BumpLog_quickMeetingId_idx" ON "BumpLog"("quickMeetingId");
CREATE INDEX "BumpLog_bumpedAt_idx" ON "BumpLog"("bumpedAt" DESC);
