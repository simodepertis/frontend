import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 Test API chiamata')
  return NextResponse.json({ 
    message: 'Test API funziona!', 
    timestamp: new Date().toISOString() 
  })
}

export async function POST() {
  console.log('🧪 Test API POST chiamata')
  return NextResponse.json({ 
    message: 'Test POST funziona!', 
    timestamp: new Date().toISOString() 
  })
}
