import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, validateEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

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


    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Verifica la password
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Genera il token JWT
    const token = generateToken(user.id, user.email)

    // Crea la risposta con il cookie
    const response = NextResponse.json(
      {
        message: 'Login effettuato con successo',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          ruolo: user.ruolo
        },
        token
      },
      { status: 200 }
    )

    // Imposta il cookie httpOnly per il token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Cambiato da 'strict' a 'lax' per compatibilità
      maxAge: 7 * 24 * 60 * 60, // 7 giorni
      path: '/' // Assicura che il cookie sia disponibile su tutto il sito
    })

    return response

  } catch (error) {
    console.error('Errore durante il login:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
