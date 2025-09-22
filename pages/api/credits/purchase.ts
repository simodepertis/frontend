import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🛒 API /api/credits/purchase chiamata (Pages Router)')
  
  try {
    // Prendi token dall'header Authorization o dai cookies
    const authHeader = req.headers.authorization
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      token = req.cookies['auth-token']
    }
    
    if (!token) {
      console.log('❌ Nessun token trovato')
      return res.status(401).json({ error: 'Non autenticato' })
    }

    const payload = verifyToken(token)
    if (!payload) {
      console.log('❌ Token non valido')
      return res.status(401).json({ error: 'Token non valido' })
    }

    const { credits, method, phone } = req.body;
    const qty = Number(credits || 0);
    const paymentMethod = String(method || 'manual_bollettino'); // 'skrill' | 'manual_bonifico' | 'manual_bollettino'
    const phoneNumber = typeof phone === 'string' ? phone : undefined;
    
    if (!Number.isFinite(qty) || qty < 10) {
      console.log('❌ Quantità crediti non valida:', qty)
      return res.status(400).json({ error: 'Minimo 10 crediti' })
    }

    console.log(`🛒 Creazione ordine: ${qty} crediti, metodo: ${paymentMethod}, telefono: ${phoneNumber}`)

    // For now, handle only manual flows (bollettino/bonifico). Skrill will be wired later via hosted session.
    const order = await prisma.creditOrder.create({
      data: {
        userId: payload.userId,
        credits: qty,
        method: paymentMethod,
        status: 'PENDING',
        phone: phoneNumber || null,
      },
    });

    console.log(`✅ Ordine creato con ID: ${order.id}`)

    // Provide instructions for bollettino
    const istruzioni = paymentMethod === 'manual_bollettino'
      ? {
          tipo: 'bollettino',
          conto: 'C/C N. 001043493061',
          intestatoA: 'Infinityweb.SRLs',
          indirizzo: 'via Livorno 4 /B Modugno 70026 Bari',
          causale: `ACQUISTO CREDITI ${phoneNumber || ''}`.trim(),
          note: 'Carica una foto del bollettino pagato con il numero di telefono in causale.',
        }
      : paymentMethod === 'manual_bonifico'
      ? {
          tipo: 'bonifico',
          intestatario: 'Sorrentino Raffaele',
          iban: 'IT44D0326804000052662637180',
          causale: `ACQUISTO CREDITI ${phoneNumber || ''}`.trim(),
          note: 'Carica la ricevuta del bonifico istantaneo con il numero di telefono in causale.',
        }
      : { tipo: 'altro' };

    console.log(`📋 Istruzioni generate per: ${istruzioni.tipo}`)
    return res.status(200).json({ ok: true, order, istruzioni });
  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/credits/purchase:', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
