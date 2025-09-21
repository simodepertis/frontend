-- CreateTable
CREATE TABLE "AgencyProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "languages" JSONB,
    "cities" JSONB,
    "services" JSONB,
    "contacts" JSONB,
    "website" TEXT,
    "socials" JSONB,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgencyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EscortProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EscortProfile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EscortProfile" ("bioEn", "bioIt", "cities", "contacts", "id", "languages", "rates", "services", "updatedAt", "userId") SELECT "bioEn", "bioIt", "cities", "contacts", "id", "languages", "rates", "services", "updatedAt", "userId" FROM "EscortProfile";
DROP TABLE "EscortProfile";
ALTER TABLE "new_EscortProfile" RENAME TO "EscortProfile";
CREATE UNIQUE INDEX "EscortProfile_userId_key" ON "EscortProfile"("userId");
CREATE INDEX "EscortProfile_agencyId_idx" ON "EscortProfile"("agencyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AgencyProfile_userId_key" ON "AgencyProfile"("userId");
