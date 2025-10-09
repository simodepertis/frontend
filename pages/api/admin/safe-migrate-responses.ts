import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // Idempotente: aggiunge colonne se non esistono (PostgreSQL)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "response" TEXT;
      ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "responseAt" TIMESTAMP;
      ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "response" TEXT;
      ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "responseAt" TIMESTAMP;
    `);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: 'Migration failed', details: String(e?.message || e) });
  }
}
