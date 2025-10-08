import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verifica che le tabelle non esistano già
    const existingThreads = await prisma.$queryRawSELECT COUNT(*) FROM "ForumThread".catch(() => null);
    
    if (existingThreads) {
      return res.json({ message: 'Tabelle già esistenti', ok: true });
    }

    // Crea le tabelle usando raw SQL
    await prisma.$executeRaw
      CREATE TABLE IF NOT EXISTS "ForumThread" (
        "id" SERIAL PRIMARY KEY,
        "authorId" INTEGER NOT NULL,
        "category" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("authorId") REFERENCES "User"("id")
      );
      CREATE INDEX IF NOT EXISTS "ForumThread_category_createdAt_idx" ON "ForumThread"("category", "createdAt");
    ;

    await prisma.$executeRaw
      CREATE TABLE IF NOT EXISTS "ForumPost" (
        "id" SERIAL PRIMARY KEY,
        "threadId" INTEGER NOT NULL,
        "authorId" INTEGER NOT NULL,
        "body" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id"),
        FOREIGN KEY ("authorId") REFERENCES "User"("id")
      );
      CREATE INDEX IF NOT EXISTS "ForumPost_threadId_createdAt_idx" ON "ForumPost"("threadId", "createdAt");
    ;

    return res.json({ message: 'Tabelle forum create con successo', ok: true });
  } catch (error: any) {
    console.error('Errore creazione tabelle:', error);
    return res.status(500).json({ error: error.message });
  }
}
