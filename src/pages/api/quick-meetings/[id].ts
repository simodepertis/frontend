import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bannedPhrases = [
  'grazie per la recensione',
  'che bella recensione',
  'grazie della recensione',
  'grazie della tua recensione',
  'grazie per questa recensione',
  'ti ringrazio per la recensione',
  'grazie tesoro',
  'un bacio',
  'un bacio dolce',
  'ti aspetto',
  'a presto',
  'mille baci',
  'baci',
  'grazie mille',
  'grazie di cuore',
];

const bannedStart = [
  'grazie',
  'ciao',
  'tesoro',
  'amore',
  'un bacio',
  'baci',
  'a presto',
];

const bannedStartRe = new RegExp(
  `^\\s*(?:${bannedStart
    .map((x) => x.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|')})(?:[\\s,!?.:;\"'()\\-]|$)`,
  'i'
);

const stripEscortReply = (t: unknown) => {
  let s = String(t || '').trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  const markers = [' ha risposto', '\nha risposto', 'risposta', ' ha risposto il', ' ha risposto:', ' risponde'];
  let cut = -1;
  for (const m of markers) {
    const idx = lower.indexOf(m);
    if (idx !== -1) {
      cut = cut === -1 ? idx : Math.min(cut, idx);
    }
  }
  if (cut !== -1) {
    s = s.slice(0, cut).trim();
  }
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

const isBadText = (t: unknown) => {
  const sRaw = stripEscortReply(t);
  const s = String(sRaw || '').trim().toLowerCase();
  if (!s) return true;
  if (s.length < 60) return true;
  for (const p of bannedPhrases) {
    if (s.includes(p)) return true;
  }
  for (const st of bannedStart) {
    if (s.startsWith(st + ' ') || s === st) return true;
  }
  if (bannedStartRe.test(String(sRaw || ''))) return true;
  if (/\bti\s*(ringrazio|aspetto|bacio|abbraccio)\b/.test(s)) return true;
  if (/\bspero\s+di\s+vederti\s+presto\b/.test(s)) return true;
  if (/\b(sono|sar[oò])\s+qui\s+per\s+te\b/.test(s)) return true;
  if (/\bquando\s+vuoi\b/.test(s) && /\bti\s+aspetto\b/.test(s)) return true;
  if (/\b(miei|i\s*miei)\s*clienti\b/.test(s)) return true;
  if (/\b(recensione|stelline)\b/.test(s) && /\b(grazie|ringrazio)\b/.test(s)) return true;
  return false;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const meeting = await prisma.quickMeeting.findUnique({
        where: { id: parseInt(id as string) },
        include: {
          importedReviews: {
            orderBy: {
              reviewDate: 'desc'
            }
          }
        }
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Incontro non trovato' });
      }

      const filteredImported = (meeting.importedReviews || [])
        .filter((r) => typeof r.rating === 'number')
        .map((r) => ({
          ...r,
          reviewText: stripEscortReply(r.reviewText),
        }))
        .filter((r) => !isBadText(r.reviewText));

      return res.status(200).json({
        meeting: {
          ...meeting,
          importedReviews: filteredImported,
          reviewCount: filteredImported.length || 0,
        }
      });
    } catch (error) {
      console.error('Errore nel caricamento incontro:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const meetingId = parseInt(id as string, 10);
      const {
        title,
        description,
        category,
        city,
        zone,
        phone,
        age,
        photos,
        isActive
      } = req.body || {};

      const data: any = {};
      if (typeof title === 'string') data.title = title.slice(0, 200);
      if (typeof description === 'string') data.description = description;
      if (typeof category === 'string') data.category = category;
      if (typeof city === 'string') data.city = city.toUpperCase();
      if (typeof zone === 'string' || zone === null) data.zone = zone || null;
      if (typeof phone === 'string' || typeof phone === 'number' || phone === null) {
        const p = phone == null ? null : String(phone).trim();
        data.phone = p && p.length > 0 ? p : null;
      }
      if (typeof age === 'number' || age === null) data.age = age ?? null;
      if (Array.isArray(photos)) data.photos = photos.filter((x: any) => typeof x === 'string' && x.trim().length > 0);
      if (typeof isActive === 'boolean') data.isActive = isActive;

      const updated = await prisma.quickMeeting.update({
        where: { id: meetingId },
        data
      });

      return res.status(200).json({ meeting: updated });
    } catch (error) {
      console.error('Errore update incontro:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } else {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
}
