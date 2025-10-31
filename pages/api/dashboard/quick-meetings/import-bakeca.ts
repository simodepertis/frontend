import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { QuickMeetingCategory } from '@prisma/client';
import puppeteer from 'puppeteer';

// Helper per autenticazione
function getUserFromToken(req: NextApiRequest): { userId: number } | null {
  try {
    const token = req.cookies['auth-token'];
    if (!token) return null;
    
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

// Delay helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Funzione per scaricare annunci da Bakecaincontrii
async function scrapeBakecaincontrii(userId: number) {
  let browser;
  let imported = 0;
  let skipped = 0;
  
  try {
    console.log('🚀 Avvio importazione da Bakecaincontrii...');
    
    browser = await puppeteer.launch({
      headless: true, // Background
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Targets: tutte le categorie
    const targets = [
      { url: 'https://www.bakecaincontrii.com/donna-cerca-uomo/milano/', category: 'DONNA_CERCA_UOMO' as QuickMeetingCategory },
      { url: 'https://www.bakecaincontrii.com/trans/milano/', category: 'TRANS' as QuickMeetingCategory },
      { url: 'https://www.bakecaincontrii.com/gay/milano/', category: 'UOMO_CERCA_UOMO' as QuickMeetingCategory },
      { url: 'https://www.bakecaincontrii.com/massaggi/milano/', category: 'CENTRO_MASSAGGI' as QuickMeetingCategory }
    ];
    
    for (const target of targets) {
      console.log(`\n📂 Categoria: ${target.category}`);
      
      try {
        // Vai alla lista
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(3000);
        
        // Accetta cookie
        try {
          await page.click('button[class*="accept"]', { timeout: 3000 });
          await sleep(1000);
        } catch (e) {}
        
        // Estrai link annunci
        const adLinks = await page.evaluate(() => {
          const links: string[] = [];
          document.querySelectorAll('a[href*="/annunci/"], a[href*="/dettaglio/"]').forEach((a: any) => {
            if (a.href && a.href.includes('bakecaincontrii') && !links.includes(a.href)) {
              links.push(a.href);
            }
          });
          return links;
        });
        
        console.log(`✅ Trovati ${adLinks.length} link`);
        
        // Visita ogni annuncio (max 15)
        for (const link of adLinks.slice(0, 15)) {
          try {
            // Verifica duplicato
            const sourceId = `bkc_${target.category}_${Buffer.from(link).toString('base64').slice(0, 20)}`;
            const existing = await prisma.quickMeeting.findFirst({
              where: { sourceId, userId }
            });
            
            if (existing) {
              skipped++;
              continue;
            }
            
            // Visita dettaglio
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await sleep(2000);
            
            // Estrai dati
            const adData = await page.evaluate(() => {
              // Titolo
              const titleEl = document.querySelector('h1, .title, [class*="title"]');
              const title = titleEl ? titleEl.textContent?.trim() : '';
              
              // Descrizione
              const descEl = document.querySelector('.description, [class*="desc"], .content, p');
              const description = descEl ? descEl.textContent?.trim() : '';
              
              // Telefono
              let phone = null;
              const phoneEl = document.querySelector('a[href^="tel:"]');
              if (phoneEl) {
                const phoneMatch = phoneEl.getAttribute('href')?.match(/tel:(.+)/);
                if (phoneMatch) phone = phoneMatch[1];
              }
              
              // WhatsApp
              let whatsapp = null;
              const waEl = document.querySelector('a[href*="wa.me"]');
              if (waEl && waEl.getAttribute('href')) {
                whatsapp = waEl.getAttribute('href');
              }
              
              // Età
              let age = null;
              const ageText = document.body.textContent || '';
              const ageMatch = ageText.match(/(\d{2})\s*anni|età\s*(\d{2})/i);
              if (ageMatch) age = parseInt(ageMatch[1] || ageMatch[2]);
              
              // Tutte le foto
              const photos: string[] = [];
              document.querySelectorAll('img').forEach((img: any) => {
                const src = img.src || img.getAttribute('data-src');
                if (src && src.includes('http') && !src.includes('logo') && !photos.includes(src)) {
                  photos.push(src);
                }
              });
              
              return { title, description, phone, whatsapp, age, photos };
            });
            
            // Salva se ha dati validi
            if (adData.title && adData.title.length > 3) {
              await prisma.quickMeeting.create({
                data: {
                  title: adData.title,
                  description: adData.description || adData.title,
                  category: target.category,
                  city: 'MILANO',
                  phone: adData.phone,
                  whatsapp: adData.whatsapp,
                  age: adData.age,
                  photos: adData.photos,
                  sourceUrl: link,
                  sourceId,
                  userId, // ASSEGNA ALL'UTENTE
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
              });
              
              imported++;
              console.log(`   ✅ [${imported}] ${adData.title.slice(0, 40)}`);
            }
            
            await sleep(1500);
            
          } catch (error) {
            console.error(`   ❌ Errore annuncio:`, error);
          }
        }
        
      } catch (error) {
        console.error(`❌ Errore categoria ${target.category}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
  
  return { imported, skipped };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Verifica autenticazione
  const auth = getUserFromToken(req);
  
  if (!auth) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const userId = auth.userId;

  try {
    console.log(`📥 Inizio importazione per user ${userId}`);
    
    // Lancia scraper
    const result = await scrapeBakecaincontrii(userId);
    
    console.log(`✅ Completato: ${result.imported} importati, ${result.skipped} saltati`);
    
    return res.status(200).json({
      message: 'Importazione completata',
      imported: result.imported,
      skipped: result.skipped
    });
    
  } catch (error) {
    console.error('❌ Errore import:', error);
    return res.status(500).json({ error: 'Errore durante l\'importazione' });
  }
}
