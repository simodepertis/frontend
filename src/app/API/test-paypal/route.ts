import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    // Test che le variabili PayPal esistano
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    const env = process.env.PAYPAL_ENV || 'sandbox';
    
    return NextResponse.json({ 
      ok: true,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      env: env,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
