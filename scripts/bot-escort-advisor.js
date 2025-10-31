/**
 * Bot Escort Advisor - Importa recensioni e crea profili QuickMeeting
 * 
 * Uso: node scripts/bot-escort-advisor.js
 * 
 * Parametri opzionali:
 * - LIMIT: 50 (default) - numero recensioni da processare
 * 
 * Esempio: LIMIT=20 node scripts/bot-escort-advisor.js
 * 
 * Cosa fa:
 * 1. Scarica recensioni da escort-advisor.com
 * 2. Per ogni recensione:
 *    - Cerca QuickMeeting per telefono/nome
 *    - Se non esiste, crea QuickMeeting in categoria corretta
 *    - Salva recensione in ImportedReview
 */

const fetch = require('undici').fetch;
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LIMIT = parseInt(process.env.LIMIT || '50', 10);
const BASE_URL = 'https://www.escort-advisor.com';

function detectCategory(reviewText) {
  const text = reviewText.toLowerCase();
  if (text.includes('trans') || text.includes('transgender') || text.includes('shemale')) {
    return 'TRANS';
  }
  if (text.includes('uomo') || text.includes('gay') || text.includes('ragazzo')) {
    return 'UOMO_CERCA_UOMO';
  }
  return 'DONNA_CERCA_UOMO'; // default
}

function extractPhone(text) {
  // Estrae numeri di telefono dal testo
  const matches = text.match(/\d{9,11}/g);
  if (!matches) return null;
  return matches[0];
}

async function scrapeReviews(limit = 50) {
  console.log(`📄 Scarico recensioni da ${BASE_URL}/recensioni/`);
  
  const reviews = [];
  let page = 1;
  
  while (reviews.length < limit && page <= 5) {
    try {
      const url = page === 1 
        ? `${BASE_URL}/recensioni/` 
        : `${BASE_URL}/recensioni/page/${page}/`;
      
      console.log(`📄 Pagina ${page}...`);
      
      const res = await fetch(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0',
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8'
        },
        dispatcher: new (require('undici').Agent)({ connect: { rejectUnauthorized: false } })
      });
      
      if (!res.ok) {
        console.log(`⚠️ Pagina ${page} non disponibile`);
        break;
      }
      
      const html = await res.text();
      const $ = cheerio.load(html);
      
      $('article, .review, .recensione, .item').each((_, el) => {
        const name = $(el).find('h2, h3, .nome, .name, [class*="title"]').first().text().trim();
        const reviewText = $(el).find('p, .text, .body, [class*="desc"]').text().trim();
        const ratingEl = $(el).find('[class*="rating"], .stars, .voto');
        
        let rating = null;
        if (ratingEl.length) {
          const ratingText = ratingEl.text();
          const match = ratingText.match(/(\d+)/);
          if (match) rating = parseInt(match[1], 10);
        }
        
        const phone = extractPhone($(el).text());
        const reviewUrl = $(el).find('a').first().attr('href');
        const fullUrl = reviewUrl?.startsWith('http') ? reviewUrl : `${BASE_URL}${reviewUrl}`;
        
        if (name && name.length > 2) {
          reviews.push({
            name,
            phone,
            reviewText,
            rating,
            url: fullUrl || url,
            category: detectCategory(reviewText + ' ' + name)
          });
        }
      });
      
      page++;
    } catch (error) {
      console.error(`❌ Errore pagina ${page}:`, error.message);
      break;
    }
  }
  
  console.log(`✅ Trovate ${reviews.length} recensioni`);
  return reviews.slice(0, limit);
}

async function findOrCreateQuickMeeting(review) {
  // Cerca per telefono o nome
  let meeting = null;
  
  if (review.phone) {
    meeting = await prisma.quickMeeting.findFirst({
      where: {
        OR: [
          { phone: { contains: review.phone } },
          { whatsapp: { contains: review.phone } }
        ]
      }
    });
  }
  
  if (!meeting && review.name) {
    meeting = await prisma.quickMeeting.findFirst({
      where: {
        title: { contains: review.name, mode: 'insensitive' }
      }
    });
  }
  
  // Se non esiste, crea nuovo QuickMeeting
  if (!meeting) {
    console.log(`➕ Creo nuovo profilo per: ${review.name}`);
    
    meeting = await prisma.quickMeeting.create({
      data: {
        title: review.name,
        description: `Profilo con recensioni da Escort Advisor`,
        category: review.category,
        city: 'ITALIA', // default
        phone: review.phone || null,
        photos: [],
        sourceUrl: review.url,
        sourceId: `ea_${Buffer.from(review.url).toString('base64').slice(0, 20)}`,
        userId: null, // Profili bot senza utente
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 anno
      }
    });
  }
  
  return meeting;
}

async function saveReview(review, quickMeetingId) {
  const sourceId = `ea_review_${Buffer.from(review.url).toString('base64').slice(0, 20)}`;
  
  // Controlla se già esistente
  const exists = await prisma.importedReview.findUnique({
    where: { sourceId }
  });
  
  if (exists) {
    throw new Error('Recensione già importata');
  }
  
  // Salva recensione
  const imported = await prisma.importedReview.create({
    data: {
      escortName: review.name,
      escortPhone: review.phone,
      rating: review.rating,
      reviewText: review.reviewText,
      sourceUrl: review.url,
      sourceId,
      quickMeetingId,
      isProcessed: true
    }
  });
  
  return imported;
}

async function main() {
  console.log(`🤖 Bot Escort Advisor START`);
  console.log(`📊 Parametri: LIMIT=${LIMIT}`);
  
  const reviews = await scrapeReviews(LIMIT);
  
  if (!reviews || reviews.length === 0) {
    console.error(`❌ Nessuna recensione trovata`);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  let imported = 0;
  let skipped = 0;
  let created = 0;
  
  for (const review of reviews) {
    try {
      const meeting = await findOrCreateQuickMeeting(review);
      
      if (!meeting.sourceUrl) {
        created++;
      }
      
      await saveReview(review, meeting.id);
      
      imported++;
      console.log(`✅ Recensione importata: ${review.name.substring(0, 40)}...`);
      
    } catch (error) {
      if (error.message === 'Recensione già importata') {
        console.log(`⏭️ Skip: già importata`);
      } else {
        console.error(`❌ Errore:`, error.message);
      }
      skipped++;
    }
  }
  
  await prisma.$disconnect();
  
  console.log(`\n🎉 COMPLETATO`);
  console.log(`📊 Recensioni importate: ${imported}`);
  console.log(`➕ Profili creati: ${created}`);
  console.log(`⏭️ Saltate: ${skipped}`);
}

main().catch(async (err) => {
  console.error('❌ Errore fatale:', err);
  await prisma.$disconnect();
  process.exit(1);
});
