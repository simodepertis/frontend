import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENV = (process.env.PAYPAL_ENV || '').toLowerCase();
const PAYPAL_BASE_URL = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

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

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    const payload = verifyToken(raw || '');
    if (!payload) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID mancante' }, { status: 400 });
    }

    const order = await prisma.creditOrder.findFirst({
      where: {
        userId: payload.userId,
        meta: {
          path: ['paypalOrderId'],
          equals: orderId,
        },
        status: 'PENDING',
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
    }

    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const paypalData = await response.json();

    if (!response.ok || paypalData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', paypalData);
      return NextResponse.json({ error: 'Pagamento non completato' }, { status: 400 });
    }

    await prisma.creditOrder.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        meta: {
          ...order.meta as any,
          paypalCaptureId: paypalData.id,
          capturedAt: new Date().toISOString(),
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.creditWallet.upsert({
        where: { userId: payload.userId },
        update: {
          balance: {
            increment: order.credits,
          },
        },
        create: {
          userId: payload.userId,
          balance: order.credits,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: payload.userId,
          amount: order.credits,
          type: 'PURCHASE',
          reference: `PayPal Order ${orderId}`,
          meta: {
            paypalOrderId: orderId,
            paypalCaptureId: paypalData.id,
          },
        },
      });
    });

    const wallet = await prisma.creditWallet.findUnique({
      where: { userId: payload.userId },
    });

    return NextResponse.json({
      success: true,
      credits: order.credits,
      newBalance: wallet?.balance || 0,
    });

  } catch (error: any) {
    console.error('PayPal capture order error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
