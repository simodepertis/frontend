import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Fetch diretto senza Puppeteer (più veloce e funziona su Vercel)
async function scrapeBakeca(city: string, category: string, limit: number = 20) {
  const categoryUrls: Record<string, string> = {
    'DONNA_CERCA_UOMO': 'donna-cerca-uomo',
    'TRANS': 'trans',
    'UOMO_CERCA_UOMO': 'uomo-cerca-uomo'
  };

  const url = `https://${city.toLowerCase()}.bakecaincontrii.com/${categoryUrls[category]}/`;
  
  console.log(`📄 Scraping: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Parsing semplice HTML per estrarre link annunci
    const linkRegex = /href="(https?:\/\/[^"]+\/[^"\/]+\/[^"\/]+\/[^"\/]+\/)"/g;
    const links = [];
    let match;
    
    while ((match = linkRegex.exec(html)) !== null && links.length < limit) {
      const link = match[1];
      if (!links.includes(link)) {
        links.push(link);
      }
    }
    
    console.log(`✅ Trovati ${links.length} link`);
    return links;
    
  } catch (error) {
    console.error('❌ Errore scraping:', error);
    return [];
  }
}

async function scrapeDettaglio(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Estrazione titolo
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Estrazione descrizione
    const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i) ||
                      html.match(/<p[^>]*>([^<]{50,})<\/p>/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Estrazione telefono
    const phoneMatch = html.match(/href="tel:([^"]+)"/i);
    const phone = phoneMatch ? phoneMatch[1].trim() : null;
    
    // Estrazione WhatsApp
    const waMatch = html.match(/href="(https?:\/\/wa\.me\/[^"]+)"/i);
    const whatsapp = waMatch ? waMatch[1] : null;
    
    // Estrazione età
    const ageMatch = html.match(/(\d{2})\s*anni|età\s*(\d{2})/i);
    const age = ageMatch ? parseInt(ageMatch[1] || ageMatch[2], 10) : null;
    
    // Estrazione foto
    const photoRegex = /<img[^>]*src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp))"/gi;
    const photos = [];
    let photoMatch;
    
    while ((photoMatch = photoRegex.exec(html)) !== null && photos.length < 10) {
      const photoUrl = photoMatch[1];
      if (!photoUrl.includes('logo') && !photos.includes(photoUrl)) {
        photos.push(photoUrl);
      }
    }
    
    return { title, description, phone, whatsapp, age, photos };
    
  } catch (error) {
    console.error(`❌ Errore dettaglio ${url}:`, error);
    return null;
  }
}

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token'];
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  // Verifica che sia admin
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.ruolo !== 'admin') {
    return res.status(403).json({ error: 'Solo admin può importare annunci' });
  }

  const { city = 'Milano', category = 'DONNA_CERCA_UOMO', limit = 10 } = req.body;

  try {
    console.log(`🤖 Inizio import: ${category} - ${city} (max ${limit})`);
    
    // Scrape lista
    const links = await scrapeBakeca(city, category, limit);
    
    if (links.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: 'Nessun annuncio trovato',
        imported: 0,
        skipped: 0
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    // Process ogni link (ma max 10 per evitare timeout)
    for (const link of links.slice(0, Math.min(limit, 10))) {
      try {
        const data = await scrapeDettaglio(link);
        
        if (!data || !data.title || data.title.length < 5) {
          skipped++;
          continue;
        }

        if (!data.photos || data.photos.length === 0) {
          skipped++;
          continue;
        }

        // Crea sourceId unico
        const sourceId = `bot_${category}_${Buffer.from(link).toString('base64').slice(0, 20)}`;
        
        // Controlla duplicati
        const exists = await prisma.quickMeeting.findFirst({
          where: { sourceId }
        });

        if (exists) {
          skipped++;
          continue;
        }

        // Salva annuncio
        await prisma.quickMeeting.create({
          data: {
            title: data.title,
            description: data.description || data.title,
            category: category as any,
            city: city.toUpperCase(),
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            age: data.age || null,
            photos: data.photos,
            sourceUrl: link,
            sourceId,
            userId: userId,
            isActive: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
          }
        });

        imported++;
        console.log(`✅ Importato: ${data.title.substring(0, 50)}`);

      } catch (error: any) {
        console.error(`❌ Errore su ${link}:`, error.message);
        errors.push({ link, error: error.message });
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      imported,
      skipped,
      total: links.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('❌ Errore generale:', error);
    return res.status(500).json({ 
      error: 'Errore durante l\'importazione',
      details: error.message 
    });
  }
}
