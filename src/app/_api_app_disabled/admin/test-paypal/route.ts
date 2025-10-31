import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing PayPal integration...')
    
    // Test 1: Check environment variables
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const publicClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    
    console.log('PAYPAL_CLIENT_ID:', clientId ? 'SET' : 'MISSING')
    console.log('PAYPAL_CLIENT_SECRET:', clientSecret ? 'SET' : 'MISSING')
    console.log('NEXT_PUBLIC_PAYPAL_CLIENT_ID:', publicClientId ? 'SET' : 'MISSING')
    
    // Test 2: Try to create a test credit order
    try {
      const testOrder = await prisma.creditOrder.create({
        data: {
          userId: 1, // Assuming user ID 1 exists
          credits: 10,
          method: 'paypal',
          status: 'PENDING',
          meta: { test: true },
        },
      })
      console.log('✅ Test CreditOrder created:', testOrder.id)
      
      // Clean up test order
      await prisma.creditOrder.delete({ where: { id: testOrder.id } })
      console.log('✅ Test CreditOrder cleaned up')
      
    } catch (e: any) {
      console.log('❌ CreditOrder creation failed:', e.message)
    }

    // Test 3: Check PayPal API connectivity
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
          console.log('✅ PayPal API connection successful')
        } else {
          console.log('❌ PayPal API connection failed:', response.status)
        }
      } catch (e: any) {
        console.log('❌ PayPal API test failed:', e.message)
      }
    }

    return NextResponse.json({ 
      message: 'PayPal test completed. Check logs for details.',
      environment: {
        clientId: clientId ? 'SET' : 'MISSING',
        clientSecret: clientSecret ? 'SET' : 'MISSING',
        publicClientId: publicClientId ? 'SET' : 'MISSING',
      }
    })

  } catch (error: any) {
    console.error('PayPal test failed:', error)
    return NextResponse.json({ 
      error: 'PayPal test failed',
      details: error.message 
    }, { status: 500 })
  }
}
