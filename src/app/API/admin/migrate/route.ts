import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verifica se le tabelle esistono provando a fare una query
    console.log('Checking database tables...')
    
    try {
      await prisma.creditWallet.count()
      console.log('✅ CreditWallet table exists')
    } catch (e) {
      console.log('❌ CreditWallet table missing')
    }

    try {
      await prisma.creditTransaction.count()
      console.log('✅ CreditTransaction table exists')
    } catch (e) {
      console.log('❌ CreditTransaction table missing')
    }

    try {
      await prisma.creditOrder.count()
      console.log('✅ CreditOrder table exists')
    } catch (e) {
      console.log('❌ CreditOrder table missing')
    }

    try {
      await prisma.creditProduct.count()
      console.log('✅ CreditProduct table exists')
    } catch (e) {
      console.log('❌ CreditProduct table missing')
    }

    return NextResponse.json({ 
      message: 'Database check completed. See logs for details.',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Database check failed:', error)
    return NextResponse.json({ 
      error: 'Database check failed',
      details: error.message 
    }, { status: 500 })
  }
}
