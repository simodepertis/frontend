import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import Stripe from 'stripe'

function getOrigin(req: NextApiRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || ''
  return host ? `${proto}://${host}` : ''
}

function getAuthToken(req: NextApiRequest) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.substring(7)
  const cookieToken = req.cookies?.['auth-token']
  return cookieToken ? String(cookieToken) : ''
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const auth = verifyToken(getAuthToken(req))
    if (!auth) return res.status(401).json({ error: 'Non autenticato' })

    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY mancante' })

    const { credits } = req.body || {}
    const qty = Number(credits || 0)
    if (!Number.isFinite(qty) || qty < 10) return res.status(400).json({ error: 'Minimo 10 crediti' })

    const settings = await prisma.adminSettings.findFirst()
    const creditValueCents = settings?.creditValueCents ?? 100
    const currency = (settings?.currency ?? 'EUR').toLowerCase()
    const totalCents = qty * creditValueCents

    const order = await prisma.creditOrder.create({
      data: {
        userId: auth.userId,
        credits: qty,
        method: 'stripe',
        status: 'PENDING',
      },
    })

    const stripe = new Stripe(secretKey)

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.APP_URL ||
      getOrigin(req) ||
      'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      client_reference_id: String(order.id),
      metadata: {
        localOrderId: String(order.id),
        userId: String(auth.userId),
        credits: String(qty),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: totalCents,
            product_data: {
              name: `${qty} crediti`,
            },
          },
        },
      ],
      success_url: `${baseUrl}/dashboard/crediti?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/crediti?stripe=cancel`,
    })

    await prisma.creditOrder.update({
      where: { id: order.id },
      data: {
        meta: {
          ...(order as any).meta,
          stripeSessionId: session.id,
        },
      },
    })

    return res.status(200).json({ ok: true, url: session.url, sessionId: session.id, localOrderId: order.id })
  } catch (e) {
    console.error('❌ /api/credits/stripe/create-checkout-session error:', e)
    return res.status(500).json({ error: 'Errore interno', details: (e as any)?.message || String(e) })
  }
}
