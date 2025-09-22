import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const body = req.body || {}
    const qty = Number(body?.credits || 0)
    const method = String(body?.method || 'manual_bollettino') // 'skrill' | 'manual_bonifico' | 'manual_bollettino'
    const phone = typeof body?.phone === 'string' ? body.phone : undefined
    if (!Number.isFinite(qty) || qty < 10) {
      return res.status(400).json({ error: 'Minimo 10 crediti' })
    }

    const order = await prisma.creditOrder.create({
      data: {
        userId: payload.userId,
        credits: qty,
        method,
        status: 'PENDING',
        phone: phone || null,
      },
    })

    const istruzioni = method === 'manual_bollettino'
      ? {
          tipo: 'bollettino',
          conto: 'C/C N. 001043493061',
          intestatoA: 'Infinityweb.SRLs',
          indirizzo: 'via Livorno 4 /B Modugno 70026 Bari',
          causale: `ACQUISTO CREDITI ${phone || ''}`.trim(),
          note: 'Carica una foto del bollettino pagato con il numero di telefono in causale.',
        }
      : method === 'manual_bonifico'
      ? {
          tipo: 'bonifico',
          intestatario: 'Sorrentino Raffaele',
          iban: 'IT44D0326804000052662637180',
          causale: `ACQUISTO CREDITI ${phone || ''}`.trim(),
          note: 'Carica la ricevuta del bonifico istantaneo con il numero di telefono in causale.',
        }
      : { tipo: 'altro' }

    return res.json({ ok: true, order, istruzioni })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
