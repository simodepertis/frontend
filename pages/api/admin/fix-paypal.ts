import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔧 Fixing PayPal - Creating missing tables...')
    
    // Crea le tabelle mancanti direttamente con SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CreditWallet" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER UNIQUE NOT NULL,
        "balance" INTEGER DEFAULT 0 NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CreditTransaction" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "amount" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "reference" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CreditOrder" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "credits" INTEGER NOT NULL,
        "method" TEXT NOT NULL,
        "status" TEXT DEFAULT 'PENDING' NOT NULL,
        "phone" TEXT,
        "receiptUrl" TEXT,
        "meta" JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CreditProduct" (
        "id" SERIAL PRIMARY KEY,
        "code" TEXT UNIQUE NOT NULL,
        "label" TEXT NOT NULL,
        "creditsCost" INTEGER NOT NULL,
        "durationDays" INTEGER,
        "pricePerDayCredits" INTEGER,
        "minDays" INTEGER,
        "maxDays" INTEGER,
        "active" BOOLEAN DEFAULT true NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `
    
    // Crea prodotti di default se non esistono
    await prisma.$executeRaw`
      INSERT INTO "CreditProduct" ("code", "label", "creditsCost", "durationDays", "active")
      VALUES 
        ('VIP', 'Pacchetto VIP', 5, 30, true),
        ('ORO', 'Pacchetto ORO', 4, 30, true),
        ('ARGENTO', 'Pacchetto ARGENTO', 3, 30, true),
        ('TITANIO', 'Pacchetto TITANIO', 2, 30, true)
      ON CONFLICT ("code") DO NOTHING;
    `
    
    console.log('✅ Tabelle create con successo!')
    
    // Test finale
    const walletCount = await prisma.creditWallet.count()
    const orderCount = await prisma.creditOrder.count()
    const productCount = await prisma.creditProduct.count()
    
    return res.json({
      success: true,
      message: 'PayPal tables created successfully',
      counts: {
        wallets: walletCount,
        orders: orderCount,
        products: productCount
      }
    })

  } catch (error: any) {
    console.error('❌ Errore creazione tabelle:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create PayPal tables',
      details: error.message
    })
  }
}
