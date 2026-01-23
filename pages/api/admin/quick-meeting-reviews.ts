import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function stripEscortReply(t: unknown) {
  let s = String(t || '').trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  const markers = [' ha risposto', '\nha risposto', 'risposta', ' ha risposto il', ' ha risposto:', ' risponde'];
  let cut = -1;
  for (const m of markers) {
    const idx = lower.indexOf(m);
    if (idx !== -1) cut = cut === -1 ? idx : Math.min(cut, idx);
  }
  if (cut !== -1) s = s.slice(0, cut).trim();
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function isBadText(
  t: unknown,
  bannedPhrases: string[],
  bannedStart: string[],
  bannedStartRe: RegExp,
  clientSignals: string[]
) {
  const sRaw = stripEscortReply(t);
  const s = String(sRaw || '').trim().toLowerCase();
  if (!s) return true;
  if (s.length < 40) return true;
  for (const p of bannedPhrases) {
    if (s.includes(p)) return true;
  }
  for (const st of bannedStart) {
    if (s.startsWith(st + ' ') || s === st) return true;
  }
  if (bannedStartRe.test(String(sRaw || ''))) return true;
  if (/\bti\s*(ringrazio|aspetto|bacio|abbraccio)\b/.test(s)) return true;
  if (/\b(feedback|ospiti|clienti)\b/.test(s) && /\b(grazie|ringrazio|scusa|dispiace)\b/.test(s)) return true;
  if (/\bspero\s+di\s+vederti\s+presto\b/.test(s)) return true;
  if (/\b(sono|sar[oò])\s+qui\s+per\s+te\b/.test(s)) return true;
  if (/\bquando\s+vuoi\b/.test(s) && /\bti\s+aspetto\b/.test(s)) return true;
  if (/\b(miei|i\s*miei)\s*clienti\b/.test(s)) return true;
  if (/\b(recensione|stelline)\b/.test(s) && /\b(grazie|ringrazio)\b/.test(s)) return true;
  const hasClientSignal = clientSignals.some((k) => s.includes(k));
  if (!hasClientSignal && s.length < 120) return true;
  return false;
}

function hash32(seed: number) {
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

function getBearer(req: NextApiRequest): string | null {
  const h = req.headers['authorization'];
  if (!h) return null;
  const m = /Bearer\s+(.+)/i.exec(Array.isArray(h) ? h[0] : h);
  return m ? m[1] : null;
}

async function requireAdmin(req: NextApiRequest) {
  const raw = getBearer(req);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u) return null;
  const whitelist = new Set(['admin@local', 'musicamagazine23@gmail.com']);
  if (u.ruolo === 'admin' || whitelist.has(u.email)) return payload;
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: 'Non autorizzato' });

      const scope = String(req.query.scope || '').toLowerCase();
      const take = Math.max(1, Math.min(500, Number(req.query.take) || 200));
      const skip = Math.max(0, Number(req.query.skip) || 0);
      const meetingId = Number(req.query.meetingId || 0);
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      const qDigits = q ? q.replace(/[^0-9+]/g, '') : '';
      const qDigitsOnly = qDigits.replace(/\D/g, '');
      const phoneCandidates: string[] = [];
      const phoneChunkCandidates: string[][] = [];
      if (qDigitsOnly.length >= 6) {
        const base = qDigitsOnly.startsWith('39') ? qDigitsOnly.slice(2) : qDigitsOnly;
        if (base) {
          phoneCandidates.push(base);
          phoneCandidates.push(`39${base}`);
          phoneCandidates.push(`+39${base}`);
          if (base.length >= 9) {
            phoneChunkCandidates.push([base.slice(0, 3), base.slice(3, 6), base.slice(6)]);
          }
          if (base.length >= 7) {
            const last7 = base.slice(-7);
            phoneChunkCandidates.push([last7.slice(0, 3), last7.slice(3)]);
          }
        }
        if (qDigits && qDigits !== q) phoneCandidates.push(qDigits);
      }
      const phoneCandidatesUnique = Array.from(new Set(phoneCandidates.filter(Boolean)));
      const phoneChunkCandidatesUnique = phoneChunkCandidates
        .map((chunks) => chunks.map((c) => String(c || '').trim()).filter(Boolean))
        .filter((chunks) => chunks.length >= 2);

      const shouldTryPhoneResolve = qDigitsOnly.length >= 6;

      const phoneMeetingOr: any[] = [];
      if (shouldTryPhoneResolve) {
        for (const cand of phoneCandidatesUnique) {
          phoneMeetingOr.push({ phone: { contains: cand } });
          phoneMeetingOr.push({ whatsapp: { contains: cand } });
          phoneMeetingOr.push({ telegram: { contains: cand } });
        }
        for (const chunks of phoneChunkCandidatesUnique) {
          phoneMeetingOr.push({ AND: chunks.map((c) => ({ phone: { contains: c } })) });
          phoneMeetingOr.push({ AND: chunks.map((c) => ({ whatsapp: { contains: c } })) });
          phoneMeetingOr.push({ AND: chunks.map((c) => ({ telegram: { contains: c } })) });
        }
      }

      const matchingMeetings = shouldTryPhoneResolve && phoneMeetingOr.length > 0
        ? await prisma.quickMeeting.findMany({
          where: { OR: phoneMeetingOr },
          take: 50,
          select: { id: true, title: true, category: true, phone: true, whatsapp: true, telegram: true },
        })
        : [];

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
      ];

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

      const where: any = scope === 'all'
        ? {}
        : { isApproved: false, isVisible: true };

      if (Number.isFinite(meetingId) && meetingId > 0) {
        where.quickMeetingId = meetingId;
      }

      if (q) {
        const or: any[] = [
          { title: { contains: q, mode: 'insensitive' } },
          { reviewText: { contains: q, mode: 'insensitive' } },
          { user: { is: { email: { contains: q, mode: 'insensitive' } } } },
          { user: { is: { nome: { contains: q, mode: 'insensitive' } } } },
          { quickMeeting: { is: { title: { contains: q, mode: 'insensitive' } } } },
          { quickMeeting: { is: { phone: { contains: q } } } },
          { quickMeeting: { is: { whatsapp: { contains: q } } } },
          { quickMeeting: { is: { telegram: { contains: q } } } },
        ];
        for (const cand of phoneCandidatesUnique) {
          or.push({ quickMeeting: { is: { phone: { contains: cand } } } });
          or.push({ quickMeeting: { is: { whatsapp: { contains: cand } } } });
          or.push({ quickMeeting: { is: { telegram: { contains: cand } } } });
        }
        for (const chunks of phoneChunkCandidatesUnique) {
          or.push({ quickMeeting: { is: { AND: chunks.map((c) => ({ phone: { contains: c } })) } } });
          or.push({ quickMeeting: { is: { AND: chunks.map((c) => ({ whatsapp: { contains: c } })) } } });
          or.push({ quickMeeting: { is: { AND: chunks.map((c) => ({ telegram: { contains: c } })) } } });
        }
        where.OR = or;
      }

      const [manualItems, manualTotal] = await Promise.all([
        prisma.quickMeetingReview.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          select: {
            id: true,
            title: true,
            rating: true,
            reviewText: true,
            createdAt: true,
            isApproved: true,
            isVisible: true,
            user: {
              select: { id: true, nome: true, email: true }
            },
            quickMeeting: {
              select: { id: true, title: true }
            }
          }
        }),
        prisma.quickMeetingReview.count({ where }),
      ]);

      let importedItems: any[] = [];
      let importedTotal = 0;

      let selectionItems: any[] = [];
      let selectionTotal = 0;

      const selectionMeetingIds = (() => {
        if (Number.isFinite(meetingId) && meetingId > 0) return [meetingId];
        if (shouldTryPhoneResolve && qDigitsOnly.length >= 6 && matchingMeetings.length > 0) {
          return matchingMeetings.map((m) => m.id);
        }
        return [];
      })();

      if (scope === 'all' && selectionMeetingIds.length > 0) {
        const rows = await prisma.quickMeetingImportedReviewSelection.findMany({
          where: { quickMeetingId: { in: selectionMeetingIds } },
          orderBy: [{ quickMeetingId: 'asc' }, { position: 'asc' }],
          select: {
            id: true,
            quickMeetingId: true,
            position: true,
            overrideReviewText: true,
            quickMeeting: { select: { id: true, title: true } },
            importedReview: {
              select: {
                id: true,
                reviewerName: true,
                rating: true,
                reviewText: true,
                reviewDate: true,
                createdAt: true,
                sourceUrl: true,
                sourceId: true,
                escortName: true,
                escortPhone: true,
              },
            },
          },
        });

        selectionItems = (rows || []).map((s: any) => {
          const r = s.importedReview;
          const txt = s.overrideReviewText != null ? s.overrideReviewText : r?.reviewText;
          return {
            kind: 'imported_selected',
            id: s.id,
            title: r?.reviewerName ? `Recensione di ${r.reviewerName}` : 'Recensione importata',
            rating: r?.rating ?? 0,
            reviewText: txt ?? '',
            createdAt: (r?.reviewDate || r?.createdAt).toISOString(),
            isApproved: true,
            isVisible: true,
            user: { id: 0, nome: r?.reviewerName || '—', email: r?.sourceUrl || '' },
            quickMeeting: s.quickMeeting,
            meta: {
              selectionId: s.id,
              position: s.position,
              originalImportedReviewId: r?.id,
              sourceUrl: r?.sourceUrl,
              sourceId: r?.sourceId,
              escortName: r?.escortName,
              escortPhone: r?.escortPhone,
            },
          };
        });
        selectionTotal = selectionItems.length;
      }

      // NOTE: for admin management we only return linked imported reviews (ImportedReview.quickMeetingId)
      // so deletions do not cause any substitution.

      // If we are resolving by phone/meeting and have selection rows, do not mix in linked imported reviews.
      // This keeps admin output aligned with what the public page shows (selection-based list).
      const shouldSkipImportedBecauseSelection = selectionItems.length > 0 && selectionMeetingIds.length > 0;

      if (scope === 'all' && !shouldSkipImportedBecauseSelection) {
        const importedWhere: any = {};
        if (Number.isFinite(meetingId) && meetingId > 0) {
          importedWhere.quickMeetingId = meetingId;
        }

        // If user searched a phone number, resolve the matching meetings and return imported reviews linked to them.
        // This guarantees that if you delete 1 review, the remaining set stays the same (no pool regeneration).
        if (
          !importedWhere.quickMeetingId &&
          shouldTryPhoneResolve &&
          qDigitsOnly.length >= 6 &&
          matchingMeetings.length > 0
        ) {
          importedWhere.quickMeetingId = { in: matchingMeetings.map((m) => m.id) };
        }

        if (q) {
          const importedOr: any[] = [
            { escortName: { contains: q, mode: 'insensitive' } },
            { reviewerName: { contains: q, mode: 'insensitive' } },
            { reviewText: { contains: q, mode: 'insensitive' } },
            { escortPhone: { contains: q } },
            { quickMeeting: { is: { title: { contains: q, mode: 'insensitive' } } } },
            { quickMeeting: { is: { phone: { contains: q } } } },
            { quickMeeting: { is: { whatsapp: { contains: q } } } },
            { quickMeeting: { is: { telegram: { contains: q } } } },
          ];
          for (const cand of phoneCandidatesUnique) {
            importedOr.push({ escortPhone: { contains: cand } });
            importedOr.push({ quickMeeting: { is: { phone: { contains: cand } } } });
            importedOr.push({ quickMeeting: { is: { whatsapp: { contains: cand } } } });
            importedOr.push({ quickMeeting: { is: { telegram: { contains: cand } } } });
          }
          for (const chunks of phoneChunkCandidatesUnique) {
            importedOr.push({ AND: chunks.map((c) => ({ escortPhone: { contains: c } })) });
            importedOr.push({ quickMeeting: { is: { AND: chunks.map((c) => ({ phone: { contains: c } })) } } });
            importedOr.push({ quickMeeting: { is: { AND: chunks.map((c) => ({ whatsapp: { contains: c } })) } } });
            importedOr.push({ quickMeeting: { is: { AND: chunks.map((c) => ({ telegram: { contains: c } })) } } });
          }
          importedWhere.OR = importedOr;
        }

        const importedTake = take;
        const importedSkip = skip;
        const [rawImported, rawImportedTotal] = await Promise.all([
          prisma.importedReview.findMany({
            where: importedWhere,
            orderBy: { createdAt: 'desc' },
            take: importedTake,
            skip: importedSkip,
            select: {
              id: true,
              reviewerName: true,
              rating: true,
              reviewText: true,
              reviewDate: true,
              createdAt: true,
              sourceUrl: true,
              sourceId: true,
              escortName: true,
              escortPhone: true,
              quickMeeting: { select: { id: true, title: true } },
            },
          }),
          prisma.importedReview.count({ where: importedWhere }),
        ]);

        const pickMeetingForImported = (r: any) => {
          if (r?.quickMeeting?.id) return r.quickMeeting;
          if (!shouldTryPhoneResolve || matchingMeetings.length === 0) return null;
          const ph = String(r?.escortPhone || '').replace(/[^0-9+]/g, '');
          const phDigits = ph.replace(/\D/g, '');
          if (!phDigits) return matchingMeetings[0] || null;
          const base = phDigits.startsWith('39') ? phDigits.slice(2) : phDigits;
          for (const m of matchingMeetings) {
            const s = `${m.phone || ''} ${m.whatsapp || ''} ${m.telegram || ''}`;
            if (base && s.includes(base)) return { id: m.id, title: m.title };
            if (ph && s.includes(ph)) return { id: m.id, title: m.title };
          }
          return matchingMeetings[0] ? { id: matchingMeetings[0].id, title: matchingMeetings[0].title } : null;
        };

        importedItems = rawImported.map((r) => ({
          kind: 'imported',
          id: r.id,
          title: r.reviewerName ? `Recensione di ${r.reviewerName}` : 'Recensione importata',
          rating: r.rating ?? 0,
          reviewText: r.reviewText ?? '',
          createdAt: (r.reviewDate || r.createdAt).toISOString(),
          isApproved: true,
          isVisible: true,
          user: { id: 0, nome: r.reviewerName || '—', email: r.sourceUrl || '' },
          quickMeeting: r.quickMeeting || pickMeetingForImported(r),
          meta: {
            sourceUrl: r.sourceUrl,
            sourceId: r.sourceId,
            escortName: r.escortName,
            escortPhone: r.escortPhone,
          },
        }));
        importedTotal = rawImportedTotal;

      }

      const items = [
        ...manualItems.map((r: any) => ({ ...r, kind: 'manual' })),
        ...importedItems,
        ...selectionItems,
      ].sort((a: any, b: any) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return db - da;
      });

      const total = manualTotal + importedTotal + selectionTotal;
      return res.status(200).json({ items, total, take, skip, scope: scope || 'pending' });
    } catch (e) {
      console.error('Errore API admin quick-meeting-reviews:', e);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: 'Non autorizzato' });

      const kind = String((req.query.kind ?? '') || '').toLowerCase();
      const idRaw = (req.query.id ?? (typeof req.body === 'string' ? JSON.parse(req.body).id : req.body?.id)) as any;
      const idNum = Number(idRaw || 0);
      if (!idNum) return res.status(400).json({ error: 'Parametri non validi' });

      if (kind === 'selection') {
        await prisma.quickMeetingImportedReviewSelection.delete({ where: { id: idNum } });
      } else if (kind === 'imported') {
        await prisma.importedReview.delete({ where: { id: idNum } });
      } else {
        await prisma.quickMeetingReview.delete({ where: { id: idNum } });
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Errore DELETE quick-meeting-review:', e);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: 'Non autorizzato' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const kind = String(body.kind || '').toLowerCase();
      const idNum = Number(body.id || 0);
      const action = String(body.action || '').toLowerCase();
      const reviewText = typeof body.reviewText === 'string' ? body.reviewText : undefined;
      const title = typeof body.title === 'string' ? body.title : undefined;
      const rating = body.rating != null ? Number(body.rating) : undefined;

      if (!idNum) return res.status(400).json({ error: 'Parametri non validi' });

      // Edit mode: allow updating text (and optional fields)
      if (reviewText != null || title != null || rating != null) {
        if (kind === 'selection') {
          const data: any = {};
          if (reviewText != null) data.overrideReviewText = reviewText;
          const item = await prisma.quickMeetingImportedReviewSelection.update({ where: { id: idNum }, data });
          return res.status(200).json({ ok: true, item });
        }
        if (kind === 'imported') {
          const data: any = {};
          if (reviewText != null) data.reviewText = reviewText;
          if (rating != null && Number.isFinite(rating)) data.rating = rating;
          const item = await prisma.importedReview.update({ where: { id: idNum }, data });
          return res.status(200).json({ ok: true, item });
        }

        // default/manual
        const data: any = {};
        if (reviewText != null) data.reviewText = reviewText;
        if (title != null) data.title = title;
        if (rating != null && Number.isFinite(rating)) data.rating = rating;
        const item = await prisma.quickMeetingReview.update({ where: { id: idNum }, data });
        return res.status(200).json({ ok: true, item });
      }

      // Moderate mode (existing): approve/reject only applies to manual reviews
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Parametri non validi' });
      }

      if (action === 'approve') {
        const item = await prisma.quickMeetingReview.update({
          where: { id: idNum },
          data: { isApproved: true }
        });
        return res.status(200).json({ ok: true, item });
      }
      await prisma.quickMeetingReview.delete({ where: { id: idNum } });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Errore PATCH:', e);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
