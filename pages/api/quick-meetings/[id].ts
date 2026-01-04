import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

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

function stripEscortReply(t: unknown) {
  let s = String(t || '').trim()
  if (!s) return ''
  const lower = s.toLowerCase()
  const markers = [' ha risposto', '\nha risposto', 'risposta', ' ha risposto il', ' ha risposto:', ' risponde']
  let cut = -1
  for (const m of markers) {
    const idx = lower.indexOf(m)
    if (idx !== -1) {
      cut = cut === -1 ? idx : Math.min(cut, idx)
    }
  }
  if (cut !== -1) s = s.slice(0, cut).trim()
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

function isBadText(t: unknown) {
  const sRaw = stripEscortReply(t)
  const s = String(sRaw || '').trim().toLowerCase()
  if (!s) return true
  if (s.length < 40) return true
  for (const p of bannedPhrases) {
    if (s.includes(p)) return true
  }
  for (const st of bannedStart) {
    if (s.startsWith(st + ' ') || s === st) return true
  }
  if (bannedStartRe.test(String(sRaw || ''))) return true
  if (/\bti\s*(ringrazio|aspetto|bacio|abbraccio)\b/.test(s)) return true
  if (/\b(feedback|ospiti|clienti)\b/.test(s) && /\b(grazie|ringrazio|scusa|dispiace)\b/.test(s)) return true
  if (/\bspero\s+di\s+vederti\s+presto\b/.test(s)) return true
  if (/\b(sono|sar[oò])\s+qui\s+per\s+te\b/.test(s)) return true
  if (/\bquando\s+vuoi\b/.test(s) && /\bti\s+aspetto\b/.test(s)) return true
  if (/\b(miei|i\s*miei)\s*clienti\b/.test(s)) return true
  if (/\b(recensione|stelline)\b/.test(s) && /\b(grazie|ringrazio)\b/.test(s)) return true
  const hasClientSignal = clientSignals.some((k) => s.includes(k))
  if (!hasClientSignal && s.length < 120) return true
  return false
}

function normalizeUploadUrl(u: string | null | undefined): string {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('/uploads/')) return `/api${s}`
  return s
}

function sanitizePhotos(input: any): string[] {
  let arr: any[] = []
  if (Array.isArray(input)) {
    arr = input
  } else if (typeof input === 'string') {
    const s = input.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed)) arr = parsed
        else arr = [s]
      } catch {
        arr = [s]
      }
    } else {
      arr = [s]
    }
  } else if (input && typeof input === 'object') {
    const maybe = (input as any).photos
    if (Array.isArray(maybe)) arr = maybe
  }

  return arr
    .filter((x) => typeof x === 'string')
    .map((x) => String(x).trim())
    .filter((x) => x.length > 0)
    .filter((x) => !x.startsWith('data:'))
    .filter((x) => x.length < 8192)
    .map((x) => normalizeUploadUrl(x))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'ID richiesto' })
  }

  const meetingId = parseInt(id)
  if (isNaN(meetingId)) {
    return res.status(400).json({ error: 'ID non valido' })
  }

  if (req.method === 'GET') {
    try {
      const meeting = await prisma.quickMeeting.findFirst({
        where: {
          id: meetingId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          importedReviews: {
            orderBy: {
              reviewDate: 'desc'
            },
            select: {
              id: true,
              escortName: true,
              reviewerName: true,
              rating: true,
              reviewText: true,
              reviewDate: true,
              sourceUrl: true,
            }
          }
        }
      })

      if (!meeting) {
        return res.status(404).json({ error: 'Incontro non trovato' })
      }

      const importedReviewsRaw = Array.isArray((meeting as any).importedReviews)
        ? (meeting as any).importedReviews
        : []

      const importedReviews = importedReviewsRaw
        .filter((r: any) => typeof r?.rating === 'number')
        .map((r: any) => ({
          ...r,
          reviewText: stripEscortReply(r.reviewText),
        }))
        .filter((r: any) => !isBadText(r.reviewText))

      return res.json({
        meeting: {
          ...meeting,
          photos: sanitizePhotos((meeting as any).photos),
          importedReviews,
          reviewCount: importedReviews.length,
        }
      })
    } catch (error) {
      console.error('Errore recupero incontro:', error)
      return res.status(500).json({ error: 'Errore interno del server' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
