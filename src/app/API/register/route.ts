import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validateEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, ruolo = 'user' } = body
    let nome = body.nome

    // Validazione input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatori' },
        { status: 400 }
      )
    }

    // Validazione email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }

    // Validazione password minima per velocità (almeno 6 caratteri)
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere lunga almeno 6 caratteri' },
        { status: 400 }
      )
    }

    // Nome opzionale: se mancante, deriva dalla parte locale dell'email
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      nome = email.split('@')[0]
    }

    // Controlla se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utente con questa email esiste già' },
        { status: 409 }
      )
    }

    // Hash della password
    const hashedPassword = await hashPassword(password)

    // Crea l'utente
    const user = await prisma.user.create({
      data: {
        nome,
        email,
        password: hashedPassword,
        ruolo
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ruolo: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      { 
        message: 'Utente registrato con successo',
        user 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Errore durante la registrazione:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
