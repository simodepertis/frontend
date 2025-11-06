import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Aggiungi campo profileViews a User se non esiste
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileViews" INTEGER NOT NULL DEFAULT 0;
    `).catch(() => console.log('profileViews già esistente'))

    // Crea tabella Visitor se non esiste
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Visitor" (
        "id" SERIAL PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "targetType" TEXT NOT NULL,
        "targetId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => console.log('Visitor già esistente'))

    // Crea constraint unico
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Visitor" ADD CONSTRAINT IF NOT EXISTS "Visitor_sessionId_targetType_targetId_key" 
      UNIQUE ("sessionId", "targetType", "targetId");
    `).catch(() => console.log('Constraint già esistente'))

    // Crea indici
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Visitor_targetType_targetId_idx" ON "Visitor"("targetType", "targetId");
    `).catch(() => console.log('Index già esistente'))

    return res.status(200).json({ 
      success: true, 
      message: 'Migrazione applicata con successo!' 
    })
  } catch (error: any) {
    console.error('Errore migrazione:', error)
    return res.status(500).json({ 
      error: 'Errore durante la migrazione', 
      details: error.message 
    })
  }
}
