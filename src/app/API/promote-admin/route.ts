import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ENDPOINT TEMPORANEO PER PROMUOVERE UTENTE AD ADMIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, secret } = body

    // Chiave segreta per sicurezza
    if (secret !== 'promote-admin-2024') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })
    }

    // Trova e aggiorna l'utente
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Promuovi ad admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { ruolo: 'admin' }
    })

    return NextResponse.json({ 
      message: 'Utente promosso ad admin con successo', 
      user: { id: updatedUser.id, email: updatedUser.email, ruolo: updatedUser.ruolo }
    })
  } catch (error) {
    console.error('Errore promozione admin:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
