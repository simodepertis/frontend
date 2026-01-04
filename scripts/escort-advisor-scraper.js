const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

// Helper sleep compatibile con Puppeteer recente
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ALLOW_CREATE_MEETING = false;
const HEADLESS = process.env.HEADLESS === '0' ? false : true;
const PROCESS_USER_REVIEWS = process.env.PROCESS_USER_REVIEWS === '1';
const LIMIT_PER_CITY = parseInt(process.env.LIMIT_PER_CITY || '20', 10);
const DEFAULT_CITIES = ['milano', 'roma', 'torino', 'napoli', 'bologna', 'firenze'];
const SECTIONS_RAW = String(process.env.EA_SECTIONS || 'donne,trans,uomini').trim();
const EA_SECTIONS = SECTIONS_RAW.split(',')
  .map((s) => String(s || '').trim().toLowerCase())
  .filter(Boolean)
  .filter((s) => ['donne', 'trans', 'uomini'].includes(s));
const CITIES_RAW = String(process.env.CITIES || 'ALL').trim();
const CITIES = /^all$/i.test(CITIES_RAW)
  ? DEFAULT_CITIES
  : CITIES_RAW.split(',')
      .map((s) => String(s || '').trim().toLowerCase())
      .filter(Boolean);

const prisma = new PrismaClient();

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

function isTransientDbError(err) {
  const msg = String(err?.message || err || '');
  const m = msg.toLowerCase();
  return (
    m.includes("can't reach database server") ||
    m.includes('connection terminated') ||
    m.includes('connection refused') ||
    m.includes('socket hang up') ||
    m.includes('etimedout') ||
    m.includes('timeout')
  );
}

async function withRetry(fn, label, { retries = 5, baseDelayMs = 800 } = {}) {
  let lastErr = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastErr = e;
      if (!isTransientDbError(e) || attempt === retries) {
        throw e;
      }
      const waitMs = baseDelayMs * attempt + Math.floor(Math.random() * 400);
      console.log(`🛜 DB instabile (${label}) tentativo ${attempt}/${retries} - riprovo tra ${Math.round(waitMs / 1000)}s`);
      await sleep(waitMs);
    }
  }
  throw lastErr;
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

function detectCategoryFromName(name) {
  const t = String(name || '').toLowerCase();
  if (t.includes('trans')) return 'TRANS';
  return 'DONNA_CERCA_UOMO';
}

class EscortAdvisorScraper {
  constructor() {
    this.baseUrl = 'https://www.escort-advisor.com';
    this.browser = null;
    this.page = null;
  }

  async bypassAdultGate() {
    try {
      const didClick = await this.page.evaluate(() => {
        const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const candidates = Array.from(document.querySelectorAll('a,button,input[type="button"],input[type="submit"]'));
        for (const el of candidates) {
          const txt = norm((el.innerText || el.textContent || (el.value || '')));
          if (!txt) continue;
          if (txt.includes('accedi al sito') || txt === 'accedi') {
            el.click();
            return true;
          }
        }
        return false;
      });

      if (didClick) {
        try {
          await Promise.race([
            this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
            sleep(2500),
          ]);
        } catch {}
        await sleep(1200 + Math.random() * 1200);
      }
    } catch {}
  }

  async autoScroll(maxScrolls = 12) {
    try {
      for (let i = 0; i < maxScrolls; i++) {
        await this.page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.8)));
        await sleep(500 + Math.random() * 700);
      }
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await sleep(400 + Math.random() * 600);
    } catch {}
  }

  async init() {
    console.log('🚀 Inizializzazione browser...');
    this.browser = await puppeteer.launch({ 
      headless: HEADLESS,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ]
    });
    this.page = await this.browser.newPage();
    
    // User agent per evitare detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    });
    
    // Imposta viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Best-effort: riduce alcuni segnali di automazione
    try {
      await this.page.evaluateOnNewDocument(() => {
        try {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        } catch {}
        try {
          Object.defineProperty(navigator, 'languages', { get: () => ['it-IT', 'it', 'en-US', 'en'] });
        } catch {}
        try {
          Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        } catch {}
      });
    } catch {}
  }

  async scrapeReviewsFromUrl(reviewUrl, sectionKey = 'donne') {
    try {
      console.log(`📖 Scraping recensioni da: ${reviewUrl}`);
      
      await this.page.goto(reviewUrl, { waitUntil: 'networkidle0', timeout: 60000 });

      await this.bypassAdultGate();
      
      // Attendi che la pagina carichi
      await sleep(2500 + Math.random() * 2500);

      // Trigger lazy-load / rendering dinamico
      await this.autoScroll(10);

      // Se il sito ci blocca, interrompiamo presto per evitare ban
      const isBlocked = await this.page.evaluate(() => {
        const t = String(document.title || '').toLowerCase();
        const body = String(document.body?.innerText || '').toLowerCase();
        return t.includes('blocked') || body.includes('sorry, you have been blocked') || body.includes('access denied');
      });

      if (isBlocked) {
        console.log('⛔ Bloccato da Escort Advisor (pagina anti-bot). Interrompo per evitare ban.');
        return { escortInfo: { name: 'BLOCKED', phone: null }, reviews: [] };
      }
      
      // Estrai informazioni escort
      const escortInfo = await this.page.evaluate(() => {
        const nameElement = document.querySelector('h1, .escort-name, .profile-name');

        const telLink = document.querySelector('a[href^="tel:"]');
        const phoneElement = document.querySelector('.phone, .telefono, [href^="tel:"]');

        let phone = null;
        if (telLink) {
          const href = telLink.getAttribute('href') || '';
          const raw = href.replace(/^tel:/i, '').trim();
          phone = raw ? raw : null;
        }
        if (!phone && phoneElement) {
          const t = (phoneElement.textContent || '').replace(/[^0-9+]/g, '').trim();
          phone = t ? t : null;
        }
        
        return {
          name: nameElement ? nameElement.textContent.trim() : 'Nome non trovato',
          phone
        };
      });

      // Fallback: spesso l'URL /recensioni/<numero> è il telefono
      try {
        const m = String(reviewUrl || '').match(/\/recensioni\/(\d{6,})/);
        if (m && m[1] && (!escortInfo.phone || String(escortInfo.phone).trim().length < 6)) {
          escortInfo.phone = m[1];
        }
      } catch {}

      // Fallback nome: se h1 è solo numerico, prova dal title "<telefono> - Recensioni <Nome> - escort-advisor.com"
      try {
        const betterName = await this.page.evaluate(() => {
          const t = String(document.title || '').trim();
          const m = t.match(/Recensioni\s+(.+?)\s+-\s+escort-advisor\.com/i);
          return m && m[1] ? String(m[1]).trim() : '';
        });
        if (betterName && /^[0-9\s]+$/.test(String(escortInfo.name || ''))) {
          escortInfo.name = betterName;
        }
      } catch {}

      // Estrai recensioni
      const reviews = await this.page.evaluate(() => {
        const reviewElements = (() => {
          const primary = Array.from(document.querySelectorAll('.review'));
          if (primary.length > 0) return primary;
          const secondary = Array.from(document.querySelectorAll('.recensione, .comment'));
          return secondary;
        })();
        const reviews = [];

        const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim();
        const cutAtReplyMarkers = (text) => {
          const t = String(text || '');
          const markers = [
            /\bRisposta\b/i,
            /\bha\s+risposto\b/i,
            /\brisponde\b/i,
          ];
          let cut = -1;
          for (const re of markers) {
            const m = t.match(re);
            if (m && typeof m.index === 'number') {
              cut = cut === -1 ? m.index : Math.min(cut, m.index);
            }
          }
          if (cut !== -1) return normalize(t.slice(0, cut));
          return normalize(t);
        };

        const isInsideReply = (node) => {
          try {
            const el = node && node.nodeType === 1 ? node : node?.parentElement;
            if (!el) return false;
            return !!el.closest(
              '.reply, .risposta, .answer, [class*="reply" i], [class*="risposta" i], [class*="answer" i]'
            );
          } catch {
            return false;
          }
        };

        const extractClientText = (element) => {
          try {
            const clone = element.cloneNode(true);
            const toRemove = clone.querySelectorAll(
              '.reply, .risposta, .answer, [class*="reply" i], [class*="risposta" i], [class*="answer" i]'
            );
            toRemove.forEach((n) => n.remove());
            const raw = normalize(clone.innerText || '');
            return cutAtReplyMarkers(raw);
          } catch {
            const raw = normalize(element.innerText || '');
            return cutAtReplyMarkers(raw);
          }
        };

        const stripUiText = (t) => {
          let s = normalize(t);
          if (!s) return '';
          s = s.replace(/^espandi\s+/i, '');
          s = s.replace(/\s*ti\s*è\s*stata\s*utile\?\s*$/i, '');
          s = s.replace(/^\d+\s+recensioni\s+degli\s+utenti\s*$/i, '');
          return normalize(s);
        };

        const parseItalianDateToIso = (text) => {
          const t = normalize(text);
          const m = t.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})\b/i);
          if (!m) return null;
          const day = Number(m[1]);
          const monthName = String(m[2]).toLowerCase();
          const year = Number(m[3]);
          const months = {
            gennaio: 1,
            febbraio: 2,
            marzo: 3,
            aprile: 4,
            maggio: 5,
            giugno: 6,
            luglio: 7,
            agosto: 8,
            settembre: 9,
            ottobre: 10,
            novembre: 11,
            dicembre: 12,
          };
          const month = months[monthName];
          if (!month || !day || !year) return null;
          const iso = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
          if (Number.isNaN(iso.getTime())) return null;
          return iso.toISOString();
        };

        const cleanEaReviewText = (text) => {
          let t = normalize(text);
          if (!t) return '';
          // Taglia tutto ciò che precede "voti utili" (header EA: data, user, città, contributore, conteggi)
          const util = t.match(/\b\d+\s+voti\s+utili\b/i);
          if (util && typeof util.index === 'number') {
            t = normalize(t.slice(util.index + util[0].length));
          }
          // Rimuovi residui comuni
          t = t.replace(/\bContributore\s+livello\s+\d+\b/ig, '');
          t = t.replace(/\b\d+\s+recensioni\b/ig, '');
          t = t.replace(/\b\d+\s+voti\s+utili\b/ig, '');
          t = t.replace(/^[-–—:]+\s*/, '');
          return normalize(t);
        };

        const looksLikeUiOnly = (t) => {
          const s = normalize(t).toLowerCase();
          if (!s) return true;
          if (s === 'ti è stata utile?' || s === 'espandi') return true;
          if (/^\d+\s+recensioni\s+degli\s+utenti$/.test(s)) return true;
          if (s.includes('recensioni degli utenti') && s.length < 80) return true;
          if (s.includes('ti è stata utile') && s.length < 120) return true;
          return false;
        };

        Array.from(reviewElements).forEach(element => {
          let reviewerName = element.querySelector('.reviewer-name, .nome-recensore, .author, .username, .user, [class*="author" i]')?.textContent?.trim();

          // Testo recensione: il markup EA varia molto; usare il testo del blocco è più robusto
          // (poi lo ripuliamo da reply e UI)
          let reviewText = extractClientText(element);
          if (!reviewText) {
            reviewText = cutAtReplyMarkers(String(element.innerText || ''));
          }

          reviewText = stripUiText(reviewText);
          if (looksLikeUiOnly(reviewText)) {
            return;
          }

          // Data/Username spesso sono nel testo. Estrarre prima di pulire.
          let reviewDate = null;
          const dateIsoFromText = parseItalianDateToIso(reviewText);
          if (dateIsoFromText) reviewDate = dateIsoFromText;

          if (!reviewerName) {
            const m = normalize(reviewText).match(/\b\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4}\s+([^\s]+)/i);
            if (m && m[1]) reviewerName = String(m[1]).trim();
          }

          // Ora pulisci il testo dai metadati EA
          reviewText = cleanEaReviewText(reviewText);

          // Rating: prova numero, oppure conta stelle se presenti
          let rating = null;
          const ratingElement = element.querySelector('.rating, .stelle, .stars, .voto, [class*="rating" i]');
          const tryParseRatingText = (txt) => {
            const t = String(txt || '').trim();
            if (!t) return null;
            const m = t.match(/(\d+(?:[\.,]\d+)?)/);
            if (!m) return null;
            const num = Number(String(m[1]).replace(',', '.'));
            if (!Number.isFinite(num)) return null;
            const r = Math.round(num);
            if (r >= 1 && r <= 5) return r;
            return null;
          };

          if (ratingElement) {
            rating = tryParseRatingText(ratingElement.textContent) ??
              tryParseRatingText(ratingElement.getAttribute && ratingElement.getAttribute('aria-label')) ??
              tryParseRatingText(ratingElement.getAttribute && ratingElement.getAttribute('title'));
          }

          if (rating == null) {
            const candidates = Array.from(element.querySelectorAll('[aria-label*="stelle" i],[aria-label*="star" i],[title*="stelle" i],[title*="star" i]'));
            for (const c of candidates) {
              const v = tryParseRatingText((c.getAttribute && c.getAttribute('aria-label')) || '') ??
                tryParseRatingText((c.getAttribute && c.getAttribute('title')) || '') ??
                tryParseRatingText(c.textContent || '');
              if (v != null) { rating = v; break; }
            }
          }

          if (rating == null) {
            const starEls = Array.from(element.querySelectorAll('.fa-star, .icon-star, [class*="star" i]'));
            const filled = starEls.filter((el) => {
              const cls = String(el.className || '').toLowerCase();
              if (cls.includes('empty') || cls.includes('outline') || cls.includes('off')) return false;
              if (cls.includes('fa-star-o') || cls.includes('fa-regular')) return false;
              return true;
            });
            const n = filled.length;
            if (n >= 1 && n <= 5) rating = n;
          }

          // Data dal DOM (se presente) ha priorità sul parsing testuale
          const dateElement = element.querySelector('time, .date, .data, .timestamp, [class*="date" i]');
          if (dateElement) {
            const dt = (dateElement.getAttribute && (dateElement.getAttribute('datetime') || '')) || '';
            const dateText = String(dt || dateElement.textContent || '').trim();
            const parsedDate = new Date(dateText);
            if (!isNaN(parsedDate)) reviewDate = parsedDate.toISOString();
          }

          // Filtro base: evita header/elementi vuoti
          if (reviewText && reviewText.length > 40) {
            reviews.push({ reviewerName, reviewText, rating, reviewDate });
          }
        });

        return reviews;
      });

      const totalScraped = Array.isArray(reviews) ? reviews.length : 0;

      if (!reviews || reviews.length === 0) {
        try {
          const diag = await this.page.evaluate(() => {
            const title = String(document.title || '').trim();
            const bodyText = String(document.body?.innerText || '').replace(/\s+/g, ' ').trim();
            const counts = {
              review: document.querySelectorAll('.review').length,
              recensione: document.querySelectorAll('.recensione').length,
              comment: document.querySelectorAll('.comment').length,
              article: document.querySelectorAll('article').length,
              rating: document.querySelectorAll('[class*="rating" i], .stars, .voto').length,
            };
            return { title, bodyPreview: bodyText.slice(0, 220), counts };
          });
          console.log(`🧪 Debug pagina: title="${diag.title}" counts=${JSON.stringify(diag.counts)}`);
          if (diag.bodyPreview) console.log(`🧪 Preview testo: ${diag.bodyPreview}`);
        } catch {}
      }

      console.log(`✅ Trovate ${reviews.length} recensioni per ${escortInfo.name}`);

      const escortPhoneNorm = normalizePhone(escortInfo.phone);
      const escortPhoneDigits = digitsOnlyPhone(escortPhoneNorm);

      let quickMeetingId = null;
      try {
        if (escortPhoneNorm && escortPhoneDigits) {
          const existing = await withRetry(
            () => prisma.quickMeeting.findFirst({
              where: {
                OR: [
                  { phone: { equals: escortPhoneNorm } },
                  { phone: { contains: escortPhoneDigits } },
                  { whatsapp: { contains: escortPhoneDigits } },
                ]
              },
              select: { id: true }
            }),
            'quickMeeting.findFirst(phone)'
          );
          if (existing?.id) quickMeetingId = existing.id;
        }

        if (!quickMeetingId && escortInfo.name) {
          const existingByName = await withRetry(
            () => prisma.quickMeeting.findFirst({
              where: { title: { contains: escortInfo.name, mode: 'insensitive' } },
              select: { id: true }
            }),
            'quickMeeting.findFirst(name)'
          );
          if (existingByName?.id) quickMeetingId = existingByName.id;
        }

        // Default: NON creare profili/annunci fake. Solo collegamento a annunci esistenti.
        // Override esplicito solo se ALLOW_CREATE_MEETING=1.
        if (!quickMeetingId && ALLOW_CREATE_MEETING) {
          // intentionally disabled
        }
      } catch (e) {
        console.error('❌ Errore creando/trovando QuickMeeting per recensioni:', e?.message || e);
      }

      // Salva nel database
      let kept = 0;
      let skipped = 0;
      let skipBadText = 0;
      let skipDb = 0;
      for (const review of reviews) {
        const ratingRaw = typeof review.rating === 'number' ? review.rating : null;
        const ratingNum = ratingRaw != null && Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5 ? Math.round(ratingRaw) : 5;

        let cleanedText = stripEscortReply(review.reviewText);
        try {
          const tailMarkers = [
            /\bEspandi\b/i,
            /\bInformazioni\s+personali\b/i,
            /\bFoto\s+annuncio\s+reali\?\b/i,
            /\bSegnala\b/i,
            /\bTi\s*è\s*stata\s*utile\?\b/i,
          ];
          for (const re of tailMarkers) {
            const m = String(cleanedText || '').match(re);
            if (m && typeof m.index === 'number' && m.index > 20) {
              cleanedText = String(cleanedText || '').slice(0, m.index).trim();
            }
          }
          cleanedText = String(cleanedText || '').replace(/\s+/g, ' ').trim();
        } catch {}
        if (isBadText(cleanedText)) {
          skipped++;
          skipBadText++;
          continue;
        }

        kept++;

        // SourceId stabile e realmente univoco: evita collisioni del base64 slice
        const sectionPrefix = String(sectionKey || 'donne').toLowerCase();
        const sourceId = `ea_${sectionPrefix}_${createHash('sha1')
          .update(String(reviewUrl || ''))
          .update('|')
          .update(String(review.reviewerName || ''))
          .update('|')
          .update(String(review.reviewDate || ''))
          .update('|')
          .update(String(cleanedText || ''))
          .digest('hex')}`;
        
        try {
          await withRetry(
            () => prisma.importedReview.upsert({
              where: { sourceId },
              update: {},
              create: {
                escortName: escortInfo.name,
                escortPhone: escortPhoneNorm,
                reviewerName: review.reviewerName,
                rating: ratingNum,
                reviewText: cleanedText,
                reviewDate: review.reviewDate ? new Date(review.reviewDate) : null,
                sourceUrl: reviewUrl,
                sourceId,
                quickMeetingId: quickMeetingId || null,
                isProcessed: true
              }
            }),
            'importedReview.upsert'
          );
        } catch (error) {
          skipDb++;
          console.error(`❌ Errore salvando recensione: ${error.message}`);
        }
      }

      if (process.env.DEBUG_REVIEWS === '1') {
        try {
          const preview = (reviews || []).slice(0, 2).map((r) => ({
            reviewerName: r.reviewerName,
            rating: r.rating,
            reviewText: String(r.reviewText || '').slice(0, 160),
          }));
          console.log('🧪 DEBUG_REVIEWS sample:', preview);
        } catch {}
      }

      console.log(`🧹 Filtri import: scraped=${totalScraped} kept=${kept} skipped=${skipped} skipBadText=${skipBadText} skipDb=${skipDb}`);

      return { escortInfo, reviews };
    } catch (error) {
      console.error(`❌ Errore scraping ${reviewUrl}: ${error.message}`);
      return null;
    }
  }

  async searchEscorts(city = 'milano', limit = 50) {
    try {
      console.log(`🔍 Cercando escort in ${city}...`);
      
      const candidates = [
        `${this.baseUrl}/donne/city/${encodeURIComponent(city)}`,
        `${this.baseUrl}/trans/city/${encodeURIComponent(city)}`,
        `${this.baseUrl}/uomini/city/${encodeURIComponent(city)}`,
        `${this.baseUrl}/escort`,
      ];

      let profileLinks = [];
      let sectionKey = 'donne';

      for (const searchUrl of candidates) {
        console.log(`🌐 Apro: ${searchUrl}`);
        await this.page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });

        await this.bypassAdultGate();

        // piccola pausa random per ridurre rate limiting
        await sleep(1200 + Math.random() * 1800);

        // Prova a chiudere eventuale banner cookie/consenso (best effort)
        try {
          await this.page.evaluate(() => {
            const candidates = [
              'button#onetrust-accept-btn-handler',
              'button[aria-label*="Accetta" i]',
              'button[title*="Accetta" i]',
              'button:has-text("Accetta")',
            ];
            for (const sel of candidates) {
              const el = document.querySelector(sel);
              if (el) {
                (el).click();
                break;
              }
            }
          });
        } catch {}

        // Estrai link ai profili recensioni
        profileLinks = await this.page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          const hrefs = anchors
            .map((a) => (a && a.getAttribute('href')) || '')
            .filter(Boolean)
            .map((href) => {
              try {
                return new URL(href, window.location.href).href;
              } catch {
                return '';
              }
            })
            .filter(Boolean)
            .filter((href) => href.includes('/recensioni/'));

          // Dedup semplice
          return Array.from(new Set(hrefs));
        });

        try {
          const u = new URL(searchUrl);
          const p = String(u.pathname || '').toLowerCase();
          if (p.startsWith('/uomini/')) sectionKey = 'uomini';
          else if (p.startsWith('/trans/')) sectionKey = 'trans';
          else if (p.startsWith('/donne/')) sectionKey = 'donne';
        } catch {}

        if (profileLinks.length > 0) break;
      }

      console.log(`📋 Trovati ${profileLinks.length} profili con recensioni`);

      const results = [];
      for (let i = 0; i < Math.min(profileLinks.length, limit); i++) {
        const link = profileLinks[i];
        console.log(`📖 Processando ${i + 1}/${Math.min(profileLinks.length, limit)}: ${link}`);
        
        const result = await this.scrapeReviewsFromUrl(link, sectionKey);
        if (result) results.push(result);
        
        // Pausa tra le richieste per evitare rate limiting
        // (aumentata perché il sito sembra aggressivo)
        await sleep(6000 + Math.random() * 7000);
      }

      return results;
    } catch (error) {
      console.error(`❌ Errore ricerca escort: ${error.message}`);
      return [];
    }
  }

  async searchEscortsSection(city = 'milano', sectionKey = 'donne', limit = 50) {
    try {
      const section = String(sectionKey || 'donne').toLowerCase();
      const urlMap = {
        donne: `${this.baseUrl}/donne/city/${encodeURIComponent(city)}`,
        trans: `${this.baseUrl}/trans/city/${encodeURIComponent(city)}`,
        uomini: `${this.baseUrl}/uomini/city/${encodeURIComponent(city)}`,
      };
      const searchUrl = urlMap[section] || urlMap.donne;

      console.log(`🔍 Cercando escort in ${city} (${section})...`);
      console.log(`🌐 Apro: ${searchUrl}`);
      await this.page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      await this.bypassAdultGate();
      await sleep(1200 + Math.random() * 1800);

      // Estrai link ai profili recensioni
      const profileLinks = await this.page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const hrefs = anchors
          .map((a) => (a && a.getAttribute('href')) || '')
          .filter(Boolean)
          .map((href) => {
            try {
              return new URL(href, window.location.href).href;
            } catch {
              return '';
            }
          })
          .filter(Boolean)
          .filter((href) => href.includes('/recensioni/'));
        return Array.from(new Set(hrefs));
      });

      console.log(`📋 Trovati ${profileLinks.length} profili con recensioni (${section})`);

      const results = [];
      for (let i = 0; i < Math.min(profileLinks.length, limit); i++) {
        const link = profileLinks[i];
        console.log(`📖 Processando ${i + 1}/${Math.min(profileLinks.length, limit)} (${section}): ${link}`);
        const result = await this.scrapeReviewsFromUrl(link, section);
        if (result) results.push(result);
        await sleep(6000 + Math.random() * 7000);
      }

      return results;
    } catch (error) {
      console.error(`❌ Errore ricerca escort (${sectionKey}): ${error.message}`);
      return [];
    }
  }

  async processReviews() {
    if (!PROCESS_USER_REVIEWS) {
      return;
    }
    try {
      console.log('🔄 Processando recensioni importate...');
      
      const unprocessedReviews = await prisma.importedReview.findMany({
        where: { isProcessed: false },
        take: 100
      });

      console.log(`📊 Trovate ${unprocessedReviews.length} recensioni da processare`);

      for (const review of unprocessedReviews) {
        // Cerca escort esistente per telefono o nome
        let matchedUser = null;
        
        if (review.escortPhone) {
          // Cerca per telefono nei contatti
          const profiles = await prisma.escortProfile.findMany({
            where: {
              contacts: {
                path: ['phone'],
                string_contains: review.escortPhone.slice(-8) // Ultimi 8 cifre
              }
            },
            include: { user: true }
          });
          
          if (profiles.length > 0) {
            matchedUser = profiles[0].user;
          }
        }

        if (!matchedUser) {
          // Cerca per nome simile
          const users = await prisma.user.findMany({
            where: {
              nome: {
                contains: review.escortName,
                mode: 'insensitive'
              },
              ruolo: 'escort'
            }
          });
          
          if (users.length > 0) {
            matchedUser = users[0];
          }
        }

        if (matchedUser) {
          // Crea recensione per l'utente esistente
          try {
            await prisma.review.create({
              data: {
                targetUserId: matchedUser.id,
                authorName: review.reviewerName || 'Cliente',
                rating: review.rating || 5,
                text: review.reviewText || '',
                status: 'APPROVED', // Auto-approva recensioni importate
                createdAt: review.reviewDate || new Date()
              }
            });
            
            console.log(`✅ Recensione aggiunta per ${matchedUser.nome}`);
          } catch (error) {
            console.error(`❌ Errore creando recensione: ${error.message}`);
          }
        }

        // Marca come processata
        await prisma.importedReview.update({
          where: { id: review.id },
          data: { 
            isProcessed: true,
            matchedUserId: matchedUser?.id
          }
        });
      }

      console.log('✅ Processamento recensioni completato');
    } catch (error) {
      console.error(`❌ Errore processamento recensioni: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser chiuso');
    }
    await prisma.$disconnect();
  }
}

// Funzione principale
async function main() {
  const scraper = new EscortAdvisorScraper();
  
  try {
    await scraper.init();
    
    for (const city of CITIES) {
      console.log(`\n🏙️ === PROCESSANDO ${city.toUpperCase()} ===`);
      for (const section of (EA_SECTIONS.length ? EA_SECTIONS : ['donne'])) {
        console.log(`\n🧭 Sezione EA: ${section}`);
        await scraper.searchEscortsSection(city, section, LIMIT_PER_CITY);
      }
      await scraper.processReviews();
    }
    
    console.log('\n🎉 Scraping completato con successo!');
  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await scraper.close();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = EscortAdvisorScraper;
