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
      const poolOnly = String(req.query.poolOnly || '') === '1';

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

      let poolItems: any[] = [];

      if (scope === 'all') {
        const importedWhere: any = {};
        if (Number.isFinite(meetingId) && meetingId > 0) {
          importedWhere.quickMeetingId = meetingId;
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

        const wantsPhonePool = shouldTryPhoneResolve && qDigitsOnly.length >= 6 && matchingMeetings.length > 0;
        if (wantsPhonePool) {
          const poolLimit = Math.max(1, Math.min(10, Number(req.query.poolLimit || 5)));

          const fetchGlobalPool = async (seed: number, category?: string) => {
            const cat = String(category || '').toUpperCase();
            const sectionPrefix =
              cat === 'DONNA_CERCA_UOMO'
                ? 'ea_donne_'
                : cat === 'UOMO_CERCA_UOMO'
                  ? 'ea_uomini_'
                  : cat === 'TRANS'
                    ? 'ea_trans_'
                    : cat === 'CENTRO_MASSAGGI'
                      ? 'ea_massaggi_'
                      : '';

            const where: any = {
              reviewText: { not: null },
              rating: { not: null },
              NOT: bannedPhrases.map((p) => ({ reviewText: { contains: p, mode: 'insensitive' as any } })),
            };

            if (sectionPrefix) {
              where.OR = [{ sourceId: { startsWith: sectionPrefix } }];
            }

            const total = await prisma.importedReview.count({ where });
            if (!total) return [];

            const desiredPool = Math.max(poolLimit, Math.min(400, total));
            const maxStart = Math.max(0, total - desiredPool);
            const skipPool = maxStart > 0 ? (Math.abs(seed) % (maxStart + 1)) : 0;

            const loadPool = async (takePool: number) => {
              const rows = await prisma.importedReview.findMany({
                where,
                orderBy: [{ reviewDate: 'desc' }, { createdAt: 'desc' }],
                skip: skipPool,
                take: takePool,
                select: {
                  id: true,
                  escortName: true,
                  reviewerName: true,
                  rating: true,
                  reviewText: true,
                  reviewDate: true,
                  sourceUrl: true,
                  sourceId: true,
                  createdAt: true,
                },
              });

              return rows
                .map((r: any) => ({ ...r, reviewText: stripEscortReply(r.reviewText) }))
                .filter((r: any) => !isBadText(r.reviewText, bannedPhrases, bannedStart, bannedStartRe, clientSignals));
            };

            let pool = await loadPool(desiredPool);
            if (pool.length < poolLimit && total > desiredPool) {
              pool = await loadPool(Math.min(700, total));
            }

            if (pool.length <= poolLimit) return pool;

            const h = Math.abs(seed) >>> 0;
            const step = 1 + (h % 7);
            let idx = h % pool.length;
            const out: any[] = [];
            const used = new Set<number>();
            for (let i = 0; i < poolLimit && used.size < pool.length; i++) {
              while (used.has(idx) && used.size < pool.length) {
                idx = (idx + 1) % pool.length;
              }
              used.add(idx);
              out.push(pool[idx]);
              idx = (idx + step) % pool.length;
            }
            return out;
          };

          const makePoolStableId = (meetingSeed: number, importedId: number) => {
            const h = hash32(meetingSeed ^ importedId);
            return 900000000 + (h % 900000000);
          };

          const pools = await Promise.all(
            matchingMeetings.map(async (m: any) => {
              const pool = await fetchGlobalPool(m.id, m.category);
              return { meeting: m, pool };
            })
          );

          poolItems = pools.flatMap(({ meeting, pool }: any) =>
            (pool || []).map((r: any, idx: number) => ({
              kind: 'imported_pool',
              id: makePoolStableId(meeting.id, r.id),
              title: r.reviewerName ? `Recensione di ${r.reviewerName}` : 'Recensione importata',
              rating: r.rating ?? 0,
              reviewText: r.reviewText ?? '',
              createdAt: (r.reviewDate || r.createdAt).toISOString(),
              isApproved: true,
              isVisible: true,
              user: { id: 0, nome: r.reviewerName || '—', email: r.sourceUrl || '' },
              quickMeeting: { id: meeting.id, title: meeting.title },
              meta: {
                sourceUrl: r.sourceUrl,
                sourceId: r.sourceId,
                escortName: r.escortName,
                pool: true,
                originalImportedReviewId: r.id,
                poolOrder: idx,
              },
            }))
          );
        }
      }

      if (poolOnly) {
        const items = poolItems.sort((a: any, b: any) => {
          const am = Number(a?.quickMeeting?.id ?? 0);
          const bm = Number(b?.quickMeeting?.id ?? 0);
          if (am !== bm) return am - bm;
          const ma = Number(a?.meta?.poolOrder ?? 0);
          const mb = Number(b?.meta?.poolOrder ?? 0);
          return ma - mb;
        });
        return res.status(200).json({ items, total: items.length, take, skip, scope: scope || 'pending' });
      }

      const items = [
        ...manualItems.map((r: any) => ({ ...r, kind: 'manual' })),
        ...importedItems,
        ...poolItems,
      ].sort((a: any, b: any) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return db - da;
      });

      const total = manualTotal + importedTotal + poolItems.length;
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

      if (kind === 'imported') {
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
      
      const { id, action } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const idNum = Number(id || 0);
      const act = String(action || '').toLowerCase();
      
      if (!idNum || !['approve','reject'].includes(act)) {
        return res.status(400).json({ error: 'Parametri non validi' });
      }

      if (act === 'approve') {
        const item = await prisma.quickMeetingReview.update({
          where: { id: idNum },
          data: { isApproved: true }
        });
        return res.status(200).json({ ok: true, item });
      } else {
        // Rifiuta = elimina
        await prisma.quickMeetingReview.delete({ where: { id: idNum } });
        return res.status(200).json({ ok: true });
      }
    } catch (e) {
      console.error('Errore PATCH:', e);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
