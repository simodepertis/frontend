import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENV = (process.env.PAYPAL_ENV || '').toLowerCase();
const PAYPAL_BASE_URL = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : (process.env.NODE_ENV === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com');

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const raw = getTokenFromRequest(req);
    if (!raw) return res.status(401).json({ error: 'Non autorizzato' });
    
    const payload = verifyToken(raw);
    if (!payload) return res.status(401).json({ error: 'Token non valido' });

    const { credits } = req.body;

    if (!credits || credits <= 0) {
      return res.status(400).json({ error: 'Numero crediti non valido' });
    }

    const pricePerCredit = 0.50;
    const totalAmount = (credits * pricePerCredit).toFixed(2);

    const order = await prisma.creditOrder.create({
      data: {
        userId: payload.userId,
        credits: credits,
        method: 'paypal',
        status: 'PENDING',
        meta: { pricePerCredit, totalAmount },
      },
    });

    const accessToken = await getPayPalAccessToken();
    
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
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paypalOrder),
    });

    const paypalData = await response.json();

    if (!response.ok) {
      console.error('PayPal order creation failed:', paypalData);
      return res.status(500).json({ error: 'Errore creazione ordine PayPal' });
    }

    await prisma.creditOrder.update({
      where: { id: order.id },
      data: {
        meta: {
          ...order.meta as any,
          paypalOrderId: paypalData.id,
        },
      },
    });

    return res.json({
      orderId: paypalData.id,
      dbOrderId: order.id,
    });

  } catch (error: any) {
    console.error('PayPal create order error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
