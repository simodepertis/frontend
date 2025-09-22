import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function requireAuth(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    return user;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const u = await requireAuth(req);
      if (!u) return res.status(401).json({ error: 'Non autenticato' });
      
      const escort = await prisma.escortProfile.findUnique({ where: { userId: u.id } });
      return res.json({ consentAcceptedAt: escort?.consentAcceptedAt ?? null });
    } catch (e) {
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      console.log('🔍 DEBUG Consent PATCH - Starting...');
      
      const u = await requireAuth(req);
      if (!u) {
        console.log('❌ DEBUG Consent - Not authenticated');
        return res.status(401).json({ error: 'Non autenticato' });
      }

      console.log('🔍 DEBUG Consent - User authenticated:', u.id, u.email, u.ruolo);

      // Check if user is escort
      if (u.ruolo !== 'escort') {
        console.log('❌ DEBUG Consent - User is not escort:', u.ruolo);
        return res.status(403).json({ error: 'Solo gli escort possono accettare il consenso' });
      }

      // Ensure escort profile exists
      console.log('🔍 DEBUG Consent - Creating/finding profile...');
      const profile = await prisma.escortProfile.upsert({
        where: { userId: u.id },
        update: {},
        create: { userId: u.id },
      });

      console.log('🔍 DEBUG Consent - Profile found/created:', profile.id);

      // Update with consent
      console.log('🔍 DEBUG Consent - Updating with consent...');
      const now = new Date();
      const updatedProfile = await prisma.escortProfile.update({
        where: { userId: u.id },
        data: { consentAcceptedAt: now },
      });

      console.log('🔍 DEBUG Consent - SUCCESS! Consent set:', updatedProfile.consentAcceptedAt);
      
      return res.json({ 
        ok: true, 
        message: 'Consenso registrato con successo',
        consentAcceptedAt: updatedProfile.consentAcceptedAt?.toISOString()
      });
    } catch (e) {
      console.error('❌ DEBUG Consent - CRITICAL ERROR:', e);
      return res.status(500).json({ 
        error: 'Errore interno del server', 
        details: e instanceof Error ? e.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Metodo non supportato' });
}
