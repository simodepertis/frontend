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
const { createHash } = require('crypto');

const prisma = new PrismaClient();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LIMIT = parseInt(process.env.LIMIT || '50', 10);
const BASE_URL = 'https://www.escort-advisor.com';
const ALLOW_CREATE_MEETING = false;

const bannedPhrases = [
  'grazie per la recensione',
  'che bella recensione',
  'grazie della recensione',
  'grazie della tua recensione',
  'grazie per questa recensione',
  'ti ringrazio per la recensione',
  'grazie per le tue parole',
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

function stripEscortReply(t) {
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

function isBadText(t) {
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
}

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

function normalizePhone(raw) {
  const v = String(raw || '').trim();
  if (!v) return null;
  const digits = v.replace(/[^0-9+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('39') && digits.length >= 11 && digits.length <= 13) return `+${digits}`;
  if (digits.length >= 8 && digits.length <= 11) return `+39${digits}`;
  return `+${digits}`;
}

function digitsOnlyPhone(p) {
  const v = String(p || '').replace(/\D/g, '');
  return v || null;
}

function extractPhone(text) {
  // Estrae numeri di telefono (Italia) dal testo
  const src = String(text || '');
  const candidates = [];
  // +39XXXXXXXXX / 0039XXXXXXXXX
  const m1 = src.match(/(?:\+39|0039)\s*\d{8,11}/g);
  if (m1) candidates.push(...m1);
  // 9-11 cifre (cell/landline)
  const m2 = src.match(/\b\d{9,11}\b/g);
  if (m2) candidates.push(...m2);

  for (const c of candidates) {
    const n = normalizePhone(c);
    if (n) return n;
  }
  return null;
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
        let preview = '';
        try {
          const t = await res.text();
          preview = String(t || '').slice(0, 300).replace(/\s+/g, ' ').trim();
        } catch {}
        console.log(`⚠️ Pagina ${page} non disponibile (HTTP ${res.status})`);
        if (preview) console.log(`🧪 Preview risposta: ${preview}`);

        if (res.status === 403) {
          console.log(`\n⛔ Escort Advisor sta bloccando le richieste HTTP (403).`);
          console.log(`👉 Usa lo scraper Puppeteer (browser reale), es.:`);
          console.log(`   node scripts/escort-advisor-scraper.js`);
          console.log(`   (opzionale) HEADLESS=0 per vedere il browser e ridurre blocchi`);
        }
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
  const phoneNorm = normalizePhone(review.phone);
  const phoneDigits = digitsOnlyPhone(phoneNorm);
  
  if (phoneNorm && phoneDigits) {
    meeting = await prisma.quickMeeting.findFirst({
      where: {
        OR: [
          { phone: { equals: phoneNorm } },
          { phone: { contains: phoneDigits } },
          { whatsapp: { contains: phoneDigits } }
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
  
  // Se non esiste, per default NON creare profili/annunci fake.
  // Override esplicito solo se ALLOW_CREATE_MEETING=1.
  if (!meeting && ALLOW_CREATE_MEETING) {
    // intentionally disabled
  }

  return { meeting: meeting || null, createdNew: false };
}

async function saveReview(review, quickMeetingId) {
  const sourceId = `ea_review_${createHash('sha1').update(String(review.url || '')).digest('hex')}`;
  
  // Controlla se già esistente
  const exists = await prisma.importedReview.findUnique({
    where: { sourceId }
  });
  
  if (exists) {
    throw new Error('Recensione già importata');
  }
  
  const ratingNum = typeof review.rating === 'number' ? review.rating : null;
  if (ratingNum == null || !Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new Error('Recensione non valida (rating mancante)');
  }

  const cleanedText = stripEscortReply(review.reviewText);
  if (isBadText(cleanedText)) {
    throw new Error('Recensione non valida (risposta/promozione)');
  }

  // Salva recensione
  const imported = await prisma.importedReview.create({
    data: {
      escortName: review.name,
      escortPhone: normalizePhone(review.phone),
      rating: ratingNum,
      reviewText: cleanedText,
      sourceUrl: review.url,
      sourceId,
      quickMeetingId,
      isProcessed: true
    }
  });
  
  return imported;
}

async function runOnce() {
  console.log(`🤖 Bot Escort Advisor RUN`);
  console.log(`📊 Parametri: LIMIT=${LIMIT}`);
  if (!ALLOW_CREATE_MEETING) {
    console.log(`ℹ️ Modalità sicura: non creo annunci QuickMeeting. Collego recensioni solo ad annunci esistenti.`);
  }

  const reviews = await scrapeReviews(LIMIT);

  if (!reviews || reviews.length === 0) {
    console.error(`❌ Nessuna recensione trovata`);
    return;
  }

  let imported = 0;
  let skipped = 0;
  let created = 0;
  let unlinked = 0;

  for (const review of reviews) {
    try {
      const { meeting, createdNew } = await findOrCreateQuickMeeting(review);
      if (createdNew) created++;
      if (meeting && meeting.id) {
        await saveReview(review, meeting.id);
      } else {
        await saveReview(review, null);
        unlinked++;
      }

      imported++;
      console.log(`✅ Recensione importata: ${review.name.substring(0, 40)}...`);

    } catch (error) {
      if (error.message === 'Recensione già importata') {
        console.log(`⏭️ Skip: già importata`);
      } else if (String(error.message || '') === 'Recensione non valida (rating mancante)' || String(error.message || '') === 'Recensione non valida (risposta/promozione)') {
        console.log(`⏭️ Skip: ${error.message}`);
      } else {
        console.error(`❌ Errore:`, error.message);
      }
      skipped++;
    }
  }

  console.log(`\n🎉 RUN COMPLETATA`);
  console.log(`📊 Recensioni importate: ${imported}`);
  console.log(`➕ Profili creati: ${created}`);
  console.log(`🔗 Non collegate (nessun match): ${unlinked}`);
  console.log(`⏭️ Saltate: ${skipped}`);
}

async function main() {
  const LOOP = process.env.LOOP === '1';
  const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || '30', 10);

  if (!LOOP) {
    await runOnce();
    await prisma.$disconnect();
    return;
  }

  console.log(`♻️ Modalità LOOP attiva (INTERVAL_MINUTES=${INTERVAL_MINUTES})`);

  while (true) {
    try {
      await runOnce();
    } catch (err) {
      console.error('❌ Errore in runOnce:', err);
    }

    console.log(`⏸️ Attendo ${INTERVAL_MINUTES} minuti prima del prossimo giro...`);
    await sleep(INTERVAL_MINUTES * 60 * 1000);
  }
}

main().catch(async (err) => {
  console.error('❌ Errore fatale:', err);
  await prisma.$disconnect();
  process.exit(1);
});
