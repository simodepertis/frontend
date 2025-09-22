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

  console.log('👑 API /api/create-admin chiamata')
  
  try {
    // Credenziali admin predefinite
    const adminEmail = 'admin@incontriesescort.org'
    const adminPassword = 'Admin123!'
    const adminName = 'Amministratore'
    
    // Controlla se admin esiste già
    const existingAdmin = await prisma.user.findUnique({ 
      where: { email: adminEmail } 
    })
    
    if (existingAdmin) {
      return res.status(200).json({ 
        message: 'Admin già esistente',
        email: adminEmail,
        password: adminPassword
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(adminPassword)

    // Crea admin
    const admin = await prisma.user.create({
      data: { 
        nome: adminName, 
        email: adminEmail, 
        password: hashedPassword, 
        ruolo: 'admin'
      },
      select: { id: true, nome: true, email: true, ruolo: true, createdAt: true }
    })

    console.log('✅ Admin creato:', admin.email)
    
    return res.status(201).json({ 
      message: 'Admin creato con successo',
      admin: admin,
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    })
  } catch (error: unknown) {
    console.error('❌ ERRORE creazione admin:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
