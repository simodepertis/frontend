import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    if (!clientId) {
      return NextResponse.json({ error: 'PayPal clientId non configurato' }, { status: 500 });
    }
    return NextResponse.json({ clientId, currency: 'EUR' });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
