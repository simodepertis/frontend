-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creditValueCents" INTEGER NOT NULL DEFAULT 100,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CreditWallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreditWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "creditsCost" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EscortProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "agencyId" INTEGER,
    "bioIt" TEXT,
    "bioEn" TEXT,
    "languages" JSONB,
    "cities" JSONB,
    "services" JSONB,
    "rates" JSONB,
    "contacts" JSONB,
    "tier" TEXT NOT NULL DEFAULT 'STANDARD',
    "tierExpiresAt" DATETIME,
    "girlOfTheDayDate" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EscortProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EscortProfile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EscortProfile" ("agencyId", "bioEn", "bioIt", "cities", "contacts", "id", "languages", "rates", "services", "updatedAt", "userId") SELECT "agencyId", "bioEn", "bioIt", "cities", "contacts", "id", "languages", "rates", "services", "updatedAt", "userId" FROM "EscortProfile";
DROP TABLE "EscortProfile";
ALTER TABLE "new_EscortProfile" RENAME TO "EscortProfile";
CREATE UNIQUE INDEX "EscortProfile_userId_key" ON "EscortProfile"("userId");
CREATE INDEX "EscortProfile_agencyId_idx" ON "EscortProfile"("agencyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CreditWallet_userId_key" ON "CreditWallet"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditProduct_code_key" ON "CreditProduct"("code");
