import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validateEmail } from '@/lib/auth'

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    .slice(0, 48);
}

export async function POST(request: NextRequest) {
  console.log('🚀 API /api/register chiamata')
  
  // Controllo variabili d'ambiente critiche
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL mancante!')
    return NextResponse.json({ error: 'Configurazione database mancante' }, { status: 500 })
  }
  
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET mancante!')
    return NextResponse.json({ error: 'Configurazione JWT mancante' }, { status: 500 })
  }
  
  try {
    const body = await request.json()
    console.log('📝 Body ricevuto:', { email: body.email, ruolo: body.ruolo })
    const { email, password, ruolo = 'user' } = body
    let nome = body.nome as string | undefined

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

    // Validazione password minima
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere lunga almeno 6 caratteri' },
        { status: 400 }
      )
    }

    // Nome opzionale: se mancante, derive dall'email
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      nome = email.split('@')[0]
    }

    // Duplicato?
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utente con questa email esiste già' },
        { status: 409 }
      )
    }

    // Hash
    const hashedPassword = await hashPassword(password)

    // Ruolo consentito - fix per compatibilità
    const allowed = ['user','escort','agency','agenzia']
    const ruoloClean = (typeof ruolo === 'string' ? ruolo.toLowerCase() : 'user')
    // Normalizza 'agency' a 'agenzia' per compatibilità
    const normalizedRole = ruoloClean === 'agency' ? 'agenzia' : ruoloClean
    const finalRole = allowed.includes(normalizedRole) ? normalizedRole : 'user'

    // Crea utente
    const finalNome = String(nome || email.split('@')[0])
    const created = await prisma.user.create({
      data: { nome: finalNome, email, password: hashedPassword, ruolo: finalRole },
      select: { id: true, nome: true, email: true, ruolo: true, createdAt: true }
    })

    // Slug post-create per garantire unicità (nome-k + id)
    const base = slugify(created.nome)
    const uniqueSlug = base ? `${base}-${created.id}` : String(created.id)
    // Nota: fino a quando non esegui prisma generate/migrate, il campo slug
    // potrebbe non esistere nel client generato e causare un lint.
    // Cast temporaneo per evitare l'errore di tipo; dopo la migrate rimuovere il cast.
    try { await (prisma as any).user.update({ where: { id: created.id }, data: { slug: uniqueSlug } }) } catch {}

    return NextResponse.json({ message: 'Utente registrato con successo', user: created }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore'
    console.error('❌ ERRORE nella registrazione:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A')
    if (message.includes('Unique') || message.includes('P2002')) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 })
    }
    console.error('Errore durante la registrazione:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
         