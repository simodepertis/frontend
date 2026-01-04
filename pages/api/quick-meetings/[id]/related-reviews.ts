import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function extractKeywords(text: string) {
  const stop = new Set([
    'e','o','ma','per','con','senza','su','già','anche','solo','poi','qui','qua','come','che','chi','cui','del','dello','della','dei','degli','delle',
    'un','uno','una','il','lo','la','i','gli','le','al','allo','alla','ai','agli','alle','da','di','in','a','ad','nel','nello','nella','nei','negli','nelle',
    'mi','ti','si','ci','vi','lui','lei','loro','io','tu','noi','voi',
    'sono','sei','è','era','sarà','ho','hai','ha','abbiamo','avete','hanno','fare','fai','fa','fanno','fatta','fatto',
    'ciao','oggi','domani','sera','mattina','pomeriggio','notte',
    'milano','roma','torino','napoli','bologna','firenze','italia'
  ])

  const raw = String(text || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-zàèéìòù0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const tokens = raw.split(' ').map((t) => t.trim()).filter(Boolean)
  const out: string[] = []
  for (const t of tokens) {
    if (t.length < 4) continue
    if (stop.has(t)) continue
    if (/^\d+$/.test(t)) continue
    if (!out.includes(t)) out.push(t)
    if (out.length >= 8) break
  }
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'ID richiesto' })
  }

  const meetingId = Number(id)
  if (!Number.isFinite(meetingId)) {
    return res.status(400).json({ error: 'ID non valido' })
  }

  const limit = Math.max(1, Math.min(10, Number(req.query.limit || 5)))
  const mode = String(req.query.mode || '').toLowerCase()

  const bannedPhrases = [
    'grazie per la recensione',
    'che bella recensione',
    'grazie della recensione',
    'grazie della tua recensione',
    'grazie per questa recensione',
    'ti ringrazio per la recensione',
    'grazie per le tue parole',
    'grazie per il vostro feedback',
    'grazie per il tuo feedback',
    'grazie per il feedback',
    'mi dispiace se',
    'mi dispiace',
    'chiedo scusa',
    'cercherò di migliorare',
    'cerco sempre di offrire',
    'cerco sempre di dare',
    'ai miei ospiti',
    'ai miei clienti',
    'ti aspetto presto',
    'grazie tesoro',
    'un bacio',
    'un bacio dolce',
    'ti aspetto',
    'a presto',
    'mille baci',
    'baci',
    'grazie mille',
    'grazie di cuore',
  ]

  const clientSignals = [
    'esperienza',
    'incontro',
    'appuntamento',
    'incontrata',
    'incontrato',
    'consiglio',
    'consigliata',
    'consigliato',
    'sono stato',
    'sono andato',
    'sono tornato',
    'ho incontrato',
    'ho visto',
    'mi sono trovato',
    'mi sono trovato bene',
    'mi sono trovato benissimo',
    'pulita',
    'pulito',
    'puntuale',
    'gentile',
    'brava',
    'accogliente',
    'riceve',
    'riceve a',
    'appartamento',
    'location',
    'zona',
    'parcheggio',
    'porta',
    'foto',
    'foto reali',
    'reali',
    'rispetta',
  ]

  const bannedStart = [
    'grazie',
    'ciao',
    'tesoro',
    'amore',
    'un bacio',
    'baci',
    'a presto',
  ]

  const bannedStartRe = new RegExp(
    `^\\s*(?:${bannedStart
      .map((x) => x.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length)
      .join('|')})(?:[\\s,!?.:;\"'()\\-]|$)`,
    'i'
  )

  const stripEscortReply = (t: unknown) => {
    let s = String(t || '').trim()
    if (!s) return ''
    // remove blocks like "Anita ha risposto ..." or "Risposta" sections if present in scraped text
    const lower = s.toLowerCase()
    const markers = [' ha risposto', '\nha risposto', 'risposta', ' ha risposto il', ' ha risposto:', ' risponde']
    let cut = -1
    for (const m of markers) {
      const idx = lower.indexOf(m)
      if (idx !== -1) {
        cut = cut === -1 ? idx : Math.min(cut, idx)
      }
    }
    if (cut !== -1) {
      s = s.slice(0, cut).trim()
    }
    s = s.replace(/\s+/g, ' ').trim()
    return s
  }

  const isBadText = (t: unknown) => {
    const sRaw = stripEscortReply(t)
    const s = String(sRaw || '').trim().toLowerCase()
    if (!s) return true
    // too short => often replies/thanks
    if (s.length < 40) return true
    for (const p of bannedPhrases) {
      if (s.includes(p)) return true
    }
    for (const st of bannedStart) {
      if (s.startsWith(st + ' ') || s === st) return true
    }
    if (bannedStartRe.test(String(sRaw || ''))) return true
    // common escort-reply/promotional patterns
    if (/\bti\s*(ringrazio|aspetto|bacio|abbraccio)\b/.test(s)) return true
    if (/\b(feedback|ospiti|clienti)\b/.test(s) && /\b(grazie|ringrazio|scusa|dispiace)\b/.test(s)) return true
    if (/\bspero\s+di\s+vederti\s+presto\b/.test(s)) return true
    if (/\b(sono|sar[oò])\s+qui\s+per\s+te\b/.test(s)) return true
    if (/\bquando\s+vuoi\b/.test(s) && /\bti\s+aspetto\b/.test(s)) return true
    if (/\b(miei|i\s*miei)\s*clienti\b/.test(s)) return true
    if (/\b(recensione|stelline)\b/.test(s) && /\b(grazie|ringrazio)\b/.test(s)) return true

    // Whitelist aggressiva: se non contiene segnali tipici da cliente, scarta
    // (serve per bloccare risposte tipo "grazie... feedback..." che a volte sfuggono)
    const hasClientSignal = clientSignals.some((k) => s.includes(k))
    // Rendi la whitelist "soft": evita falsi negativi su recensioni vere che non contengono parole chiave.
    // Se il testo è molto corto e non ha segnali da cliente, probabilmente non è una recensione utile.
    if (!hasClientSignal && s.length < 120) return true
    return false
  }

  const fetchGlobal = async (seed: number, category?: string) => {
    const cat = String(category || '').toUpperCase()
    const sectionPrefix =
      cat === 'DONNA_CERCA_UOMO'
        ? 'ea_donne_'
        : cat === 'UOMO_CERCA_UOMO'
          ? 'ea_uomini_'
          : cat === 'TRANS'
            ? 'ea_trans_'
            : cat === 'CENTRO_MASSAGGI'
              ? 'ea_massaggi_'
              : ''

    const where: any = {
      reviewText: { not: null },
      rating: { not: null },
      NOT: bannedPhrases.map((p) => ({ reviewText: { contains: p, mode: 'insensitive' as any } })),
    }

    if (sectionPrefix) {
      where.OR = [
        { sourceId: { startsWith: sectionPrefix } },
      ]
    }

    const total = await prisma.importedReview.count({ where })
    if (!total) return []

    const select = {
      id: true,
      escortName: true,
      reviewerName: true,
      rating: true,
      reviewText: true,
      reviewDate: true,
      sourceUrl: true,
    }

    // Larger pool window to reduce repetition across announcements
    const desiredPool = Math.max(limit, Math.min(400, total))
    const maxStart = Math.max(0, total - desiredPool)
    const skip = maxStart > 0 ? (Math.abs(seed) % (maxStart + 1)) : 0

    const loadPool = async (take: number) => {
      const rows = await prisma.importedReview.findMany({
        where,
        orderBy: [
          { reviewDate: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take,
        select,
      })
      return rows
        .map((r: any) => ({ ...r, reviewText: stripEscortReply(r.reviewText) }))
        .filter((r: any) => !isBadText(r.reviewText))
    }

    let pool = await loadPool(desiredPool)
    if (pool.length < limit && total > desiredPool) {
      pool = await loadPool(Math.min(700, total))
    }

    if (pool.length <= limit) return pool

    // Deterministic sampling over the pool
    const h = Math.abs(seed) >>> 0
    const step = 1 + (h % 7)
    let idx = h % pool.length
    const out: any[] = []
    const used = new Set<number>()
    for (let i = 0; i < limit && used.size < pool.length; i++) {
      while (used.has(idx) && used.size < pool.length) {
        idx = (idx + 1) % pool.length
      }
      used.add(idx)
      out.push(pool[idx])
      idx = (idx + step) % pool.length
    }
    return out
  }

  try {
    if (mode === 'global') {
      const meeting = await prisma.quickMeeting.findFirst({
        where: { id: meetingId },
        select: { category: true },
      })
      const reviews = await fetchGlobal(meetingId, meeting?.category as any)
      return res.status(200).json({ reviews, keywords: [], mode: 'global' })
    }

    const meeting = await prisma.quickMeeting.findFirst({
      where: {
        id: meetingId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      }
    })

    if (!meeting) {
      return res.status(404).json({ error: 'Incontro non trovato' })
    }

    const keywords = extractKeywords(`${meeting.title || ''} ${meeting.description || ''}`)
    if (keywords.length === 0) {
      const reviews = await fetchGlobal(meetingId, meeting.category as any)
      return res.status(200).json({ reviews, keywords, mode: 'global_fallback' })
    }

    const reviewsRaw = await prisma.importedReview.findMany({
      where: {
        reviewText: { not: null },
        rating: { not: null },
        NOT: bannedPhrases.map((p) => ({ reviewText: { contains: p, mode: 'insensitive' as any } })),
        OR: keywords.map((k) => ({ reviewText: { contains: k, mode: 'insensitive' as any } })),
      },
      orderBy: [
        { reviewDate: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        escortName: true,
        reviewerName: true,
        rating: true,
        reviewText: true,
        reviewDate: true,
        sourceUrl: true,
      }
    })

    const reviews = (reviewsRaw || [])
      .map((r: any) => ({ ...r, reviewText: stripEscortReply(r.reviewText) }))
      .filter((r: any) => !isBadText(r.reviewText))

    if (!reviews || reviews.length === 0) {
      const fallback = await fetchGlobal(meetingId, meeting.category as any)
      return res.status(200).json({ reviews: fallback, keywords, mode: 'global_fallback' })
    }

    return res.status(200).json({ reviews, keywords, mode: 'keyword' })
  } catch (e) {
    console.error('Errore related-reviews:', e)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
