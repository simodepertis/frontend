import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  
  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const raw = getTokenFromRequest(request)
    if (!raw) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    
    const payload = verifyToken(raw)
    if (!payload) return NextResponse.json({ error: 'Token non valido' }, { status: 401 })

    const body = await request.json()
    const { credits } = body

    if (!credits || credits <= 0) {
      return NextResponse.json({ error: 'Numero crediti non valido' }, { status: 400 })
    }

    // Prezzo: €0.50 per credito
    const pricePerCredit = 0.50
    const totalAmount = (credits * pricePerCredit).toFixed(2)

    // Crea ordine nel DB
    const order = await prisma.creditOrder.create({
      data: {
        userId: payload.userId,
        credits: credits,
        method: 'paypal',
        status: 'PENDING',
        meta: { pricePerCredit, totalAmount },
      },
    })

    // Crea ordine PayPal
    const accessToken = await getPayPalAccessToken()
    
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.id.toString(),
        amount: {
          currency_code: 'EUR',
          value: totalAmount,
        },
        description: `Acquisto ${credits} crediti`,
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/crediti?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/crediti?cancelled=true`,
      },
    }

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paypalOrder),
    })

    const paypalData = await response.json()

    if (!response.ok) {
      console.error('PayPal order creation failed:', paypalData)
      return NextResponse.json({ error: 'Errore creazione ordine PayPal' }, { status: 500 })
    }

    // Aggiorna ordine con PayPal ID
    await prisma.creditOrder.update({
      where: { id: order.id },
      data: {
        meta: {
          ...order.meta as any,
          paypalOrderId: paypalData.id,
        },
      },
    })

    return NextResponse.json({
      orderId: paypalData.id,
      dbOrderId: order.id,
    })

  } catch (error: any) {
    console.error('PayPal create order error:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
