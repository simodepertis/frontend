import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Chiama l'API homepage e mostra i primi 10 risultati con tier info
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public/annunci`)
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }

    const data = await response.json()
    const items = data.items || []

    const tierInfo = items.slice(0, 15).map((item: any, index: number) => ({
      position: index + 1,
      name: item.name,
      tier: item.tier,
      priority: item.priority,
      girlOfTheDay: item.girlOfTheDay,
      updatedAt: item.updatedAt
    }))

    return NextResponse.json({
      message: 'Homepage API debug',
      totalItems: items.length,
      first15Items: tierInfo
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to debug homepage API',
      details: error.message 
    }, { status: 500 })
  }
}
