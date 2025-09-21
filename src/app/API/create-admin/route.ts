import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// ENDPOINT TEMPORANEO PER CREARE ADMIN - RIMUOVERE DOPO L'USO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, secret } = body

    // Chiave segreta per sicurezza
    if (secret !== 'create-admin-2024') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password richieste' }, { status: 400 })
    }

    // Controlla se esiste già
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Utente già esistente' }, { status: 409 })
    }

    // Crea admin
    const hashedPassword = await hashPassword(password)
    const admin = await prisma.user.create({
      data: {
        nome: 'Admin',
        email,
        password: hashedPassword,
        ruolo: 'admin'
      }
    })

    return NextResponse.json({ 
      message: 'Admin creato con successo', 
      user: { id: admin.id, email: admin.email, ruolo: admin.ruolo }
    })
  } catch (error) {
    console.error('Errore creazione admin:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
