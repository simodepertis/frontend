import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🧪 API /api/create-test-accounts chiamata')
  
  try {
    const testAccounts = [
      {
        nome: 'Administrator',
        email: 'admin@test.com',
        password: 'admin123',
        ruolo: 'admin'
      },
      {
        nome: 'Utente Test',
        email: 'user@test.com', 
        password: 'user123',
        ruolo: 'user'
      },
      {
        nome: 'Escort Test',
        email: 'escort@test.com',
        password: 'escort123', 
        ruolo: 'escort'
      },
      {
        nome: 'Agenzia Test',
        email: 'agency@test.com',
        password: 'agency123',
        ruolo: 'agenzia'
      },
      {
        nome: 'Cliente Demo',
        email: 'cliente@demo.com',
        password: 'demo123',
        ruolo: 'user'
      }
    ]

    const createdAccounts = []
    
    for (const account of testAccounts) {
      // Controlla se esiste già
      const existing = await prisma.user.findUnique({ 
        where: { email: account.email } 
      })
      
      if (existing) {
        console.log(`⚠️ Account già esistente: ${account.email}`)
        createdAccounts.push({
          ...account,
          status: 'già esistente',
          id: existing.id
        })
        continue
      }

      // Hash password
      const hashedPassword = await hashPassword(account.password)

      // Crea account
      const created = await prisma.user.create({
        data: { 
          nome: account.nome,
          email: account.email,
          password: hashedPassword,
          ruolo: account.ruolo
        },
        select: { id: true, nome: true, email: true, ruolo: true, createdAt: true }
      })

      console.log(`✅ Account creato: ${account.email}`)
      
      createdAccounts.push({
        ...account,
        status: 'creato',
        id: created.id
      })
    }
    
    return res.status(200).json({ 
      message: 'Account di test creati/verificati',
      accounts: createdAccounts,
      summary: {
        total: testAccounts.length,
        created: createdAccounts.filter(a => a.status === 'creato').length,
        existing: createdAccounts.filter(a => a.status === 'già esistente').length
      }
    })
  } catch (error: unknown) {
    console.error('❌ ERRORE creazione account test:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
