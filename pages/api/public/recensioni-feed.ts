import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function normalizeUrl(u: string | null | undefined): string | null {
  const s = String(u || '')
  if (!s) return null
  if (s.startsWith('/uploads/')) return '/api' + s
  try {
    const url = new URL(s)
    if (url.pathname.startsWith('/uploads/')) return '/api' + url.pathname
  } catch {}
  return s
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)))

    // 1) Recensioni APPROVATE più recenti
    const reviews = await prisma.review.findMany({
      where: { status: 'APPROVED' as any },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, nome: true } },
        target: { select: { id: true, nome: true, slug: true } },
      },
    })

    // 2) Cover delle escort (prima foto APPROVED più recente)
    const targetIds = Array.from(new Set(reviews.map(r => r.target.id)))
    let covers: Record<number, string | null> = {}
    if (targetIds.length) {
      const photos = await prisma.photo.findMany({
        where: { userId: { in: targetIds }, status: 'APPROVED' as any },
        orderBy: { updatedAt: 'desc' },
        select: { userId: true, url: true },
      })
      for (const p of photos) {
        if (!(p.userId in covers)) covers[p.userId] = normalizeUrl(p.url)
      }
    }

    // 3) Enrich con response/responseAt se presenti in DB (best-effort)
    let enriched: any[] = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt,
      author: r.author,
      target: { id: r.target.id, nome: r.target.nome, slug: r.target.slug, coverUrl: covers[r.target.id] || null },
    }))
    try {
      if (enriched.length) {
        const ids = enriched.map(x => x.id)
        const rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, "response", "responseAt" FROM "Review" WHERE id = ANY($1::int[])`, ids as any
        )
        const map = new Map<number, { response: string | null, responseAt: Date | null }>()
        rows.forEach(r => map.set(Number(r.id), { response: (r as any).response ?? null, responseAt: (r as any).responseAt ?? null }))
        enriched = enriched.map(x => ({ ...x, response: map.get(x.id)?.response ?? null, responseAt: map.get(x.id)?.responseAt ?? null }))
      }
    } catch {}

    return res.status(200).json({ items: enriched })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
