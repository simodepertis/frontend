import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // Esegui un DDL per chiamata per evitare "cannot insert multiple commands into a prepared statement"
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "response" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "responseAt" TIMESTAMP`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "response" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "responseAt" TIMESTAMP`);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: 'Migration failed', details: String(e?.message || e) });
  }
}
