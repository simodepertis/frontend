-- CreateTable
CREATE TABLE "EscortProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "bioIt" TEXT,
    "bioEn" TEXT,
    "languages" JSONB,
    "cities" JSONB,
    "services" JSONB,
    "rates" JSONB,
    "contacts" JSONB,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EscortProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EscortProfile_userId_key" ON "EscortProfile"("userId");
