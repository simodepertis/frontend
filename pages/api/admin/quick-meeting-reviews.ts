import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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
          select: { id: true, title: true, phone: true, whatsapp: true, telegram: true },
        })
        : [];

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
      }

      const items = [
        ...manualItems.map((r: any) => ({ ...r, kind: 'manual' })),
        ...importedItems,
      ].sort((a: any, b: any) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return db - da;
      });

      const total = manualTotal + importedTotal;
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
