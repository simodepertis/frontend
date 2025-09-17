import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logout effettuato con successo' },
    { status: 200 }
  )

  // Rimuove il cookie di autenticazione
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0 // Scade immediatamente
  })

  return response
}
