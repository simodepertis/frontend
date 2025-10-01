import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🧪 Test completo PayPal...')
    
    // Test 1: Verifica variabili ambiente
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const publicClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    
    console.log('Environment variables:')
    console.log('- PAYPAL_CLIENT_ID:', clientId ? '✅ SET' : '❌ MISSING')
    console.log('- PAYPAL_CLIENT_SECRET:', clientSecret ? '✅ SET' : '❌ MISSING')
    console.log('- NEXT_PUBLIC_PAYPAL_CLIENT_ID:', publicClientId ? '✅ SET' : '❌ MISSING')
    
    // Test 2: Verifica tabelle database
    const dbTests = []
    
    try {
      const walletCount = await prisma.creditWallet.count()
      dbTests.push({ table: 'CreditWallet', status: '✅ EXISTS', count: walletCount })
    } catch (e: any) {
      dbTests.push({ table: 'CreditWallet', status: '❌ MISSING', error: e.message })
    }
    
    try {
      const orderCount = await prisma.creditOrder.count()
      dbTests.push({ table: 'CreditOrder', status: '✅ EXISTS', count: orderCount })
    } catch (e: any) {
      dbTests.push({ table: 'CreditOrder', status: '❌ MISSING', error: e.message })
    }
    
    try {
      const transactionCount = await prisma.creditTransaction.count()
      dbTests.push({ table: 'CreditTransaction', status: '✅ EXISTS', count: transactionCount })
    } catch (e: any) {
      dbTests.push({ table: 'CreditTransaction', status: '❌ MISSING', error: e.message })
    }
    
    try {
      const productCount = await prisma.creditProduct.count()
      dbTests.push({ table: 'CreditProduct', status: '✅ EXISTS', count: productCount })
    } catch (e: any) {
      dbTests.push({ table: 'CreditProduct', status: '❌ MISSING', error: e.message })
    }
    
    // Test 3: Test PayPal API connection
    let paypalTest = null
    if (clientId && clientSecret) {
      try {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://api-m.paypal.com' 
          : 'https://api-m.sandbox.paypal.com'
        
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        })
        
        if (response.ok) {
          const data = await response.json()
          paypalTest = { status: '✅ SUCCESS', tokenType: data.token_type }
        } else {
          paypalTest = { status: '❌ FAILED', httpStatus: response.status }
        }
      } catch (e: any) {
        paypalTest = { status: '❌ ERROR', error: e.message }
      }
    } else {
      paypalTest = { status: '❌ SKIPPED', reason: 'Missing credentials' }
    }

    return res.json({
      message: 'PayPal diagnostic completed',
      environment: {
        clientId: clientId ? 'SET' : 'MISSING',
        clientSecret: clientSecret ? 'SET' : 'MISSING',
        publicClientId: publicClientId ? 'SET' : 'MISSING',
      },
      database: dbTests,
      paypalApi: paypalTest,
      recommendation: dbTests.some(t => t.status.includes('MISSING')) 
        ? 'Run /api/admin/db-migrate to create missing tables'
        : 'Database tables exist, check PayPal credentials'
    })

  } catch (error: any) {
    console.error('❌ PayPal test failed:', error)
    return res.status(500).json({ 
      error: 'PayPal test failed',
      details: error.message 
    })
  }
}
