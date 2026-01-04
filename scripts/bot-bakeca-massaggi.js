/**
 * Bot Bakeca Massaggi - Importa annunci massaggi da bakeca.it
 * 
 * Uso: node scripts/bot-bakeca-massaggi.js
 * 
 * Parametri opzionali:
 * - USER_ID: ID utente (richiesto)
 * - CITY: Milano (default)
 * - LIMIT: 20 (default)
 * 
 * Esempio: USER_ID=1 CITY=Milano LIMIT=10 node scripts/bot-bakeca-massaggi.js
 */

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const USER_ID = process.env.USER_ID ? parseInt(process.env.USER_ID, 10) : null;
const CITY = process.env.CITY || 'Milano';
const LIMIT = parseInt(process.env.LIMIT || '20', 10);
const DEBUG_PHONE = process.env.DEBUG_PHONE === '1';
const HEADLESS = process.env.HEADLESS === '0' ? false : true;
const USER_DATA_DIR = process.env.USER_DATA_DIR || null;
const EXECUTABLE_PATH = process.env.EXECUTABLE_PATH || null;
const SKIP_ON_CHALLENGE = process.env.SKIP_ON_CHALLENGE === '1';
const PROXY_SERVER = process.env.PROXY_SERVER || null;
const PROXY_USER = process.env.PROXY_USER || null;
const PROXY_PASS = process.env.PROXY_PASS || null;
const LIST_RETRIES = process.env.LIST_RETRIES ? parseInt(process.env.LIST_RETRIES, 10) : 3;
const LIST_RETRY_BASE_MS = process.env.LIST_RETRY_BASE_MS ? parseInt(process.env.LIST_RETRY_BASE_MS, 10) : 7000;
const CHALLENGE_WAIT_MS = process.env.CHALLENGE_WAIT_MS ? parseInt(process.env.CHALLENGE_WAIT_MS, 10) : 2 * 60 * 1000;
const USE_BAKECAINCONTRII = process.env.USE_BAKECAINCONTRII === '1';
const AUTO_FALLBACK_TO_BAKECAINCONTRII = process.env.AUTO_FALLBACK_TO_BAKECAINCONTRII === '1';

function isChallengeError(err) {
  const msg = String(err && err.message ? err.message : err || '');
  const m = msg.toLowerCase();
  return (
    m.includes('cloudflare/turnstile challenge rilevato') ||
    m.includes('turnstile non completato') ||
    m.includes('just a moment')
  );
}

function isConnectionClosedError(err) {
  const msg = String(err && err.message ? err.message : err || '').toLowerCase();
  return (
    msg.includes('protocol error') && msg.includes('connection closed') ||
    msg.includes('session closed') ||
    msg.includes('target closed') ||
    msg.includes('err_connection_closed')
  );
}

async function ensureNotChallenge(page, contextLabel) {
  const isChallenge = await page.evaluate(() => {
    const t = (document.title || '').toLowerCase();
    const txt = (document.body ? document.body.innerText : '').toLowerCase();
    const html = (document.documentElement ? document.documentElement.outerHTML : '').toLowerCase();
    return (
      t.includes('just a moment') ||
      txt.includes('stiamo verificando') ||
      txt.includes('connessione sia sicura') ||
      html.includes('challenges.cloudflare.com') ||
      html.includes('turnstile')
    );
  });

  if (isChallenge) {
    if (SKIP_ON_CHALLENGE) {
      const e = new Error(
        `Cloudflare/Turnstile challenge rilevato (${contextLabel}). ` +
          `SKIP_ON_CHALLENGE=1: salto questa pagina e continuo.`
      );
      e.name = 'TurnstileChallengeError';
      throw e;
    }

    if (!HEADLESS) {
      console.log(
        `🛡️ Cloudflare/Turnstile challenge rilevato (${contextLabel}). ` +
          `Completa il captcha nella finestra Chrome appena aperta. Attendo fino a ${Math.round(CHALLENGE_WAIT_MS / 1000)}s...`
      );

      // Attendi finché la pagina non esce dal challenge
      try {
        await page.waitForFunction(
          () => {
            const t = (document.title || '').toLowerCase();
            const txt = (document.body ? document.body.innerText : '').toLowerCase();
            const html = (document.documentElement ? document.documentElement.outerHTML : '').toLowerCase();
            const isCh =
              t.includes('just a moment') ||
              txt.includes('stiamo verificando') ||
              txt.includes('connessione sia sicura') ||
              html.includes('challenges.cloudflare.com') ||
              html.includes('turnstile');
            return !isCh;
          },
          { timeout: CHALLENGE_WAIT_MS }
        );
      } catch (e) {
        const err = new Error(
          `Turnstile non completato o finestra chiusa durante l'attesa (${contextLabel}). ` +
            `Non chiudere Chrome mentre aspetta. Se continua a non sbloccarsi, prova: disattiva Google Translate/estensioni, disattiva VPN/adblock, oppure cambia IP (hotspot).`
        );
        err.name = 'TurnstileChallengeTimeoutError';
        throw err;
      }
      await sleep(1500);
      return;
    }

    const e = new Error(
      `Cloudflare/Turnstile challenge rilevato (${contextLabel}). ` +
        `Serve avviare il bot con HEADLESS=0 e USER_DATA_DIR per risolvere una volta il captcha e riusare i cookie.`
    );
    e.name = 'TurnstileChallengeError';
    throw e;
  }
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

function buildWhatsAppLink(phoneRaw, whatsappRaw) {
  const v = String(whatsappRaw || '').trim();
  let wa = null;
  if (v) {
    if (/^https?:\/\//i.test(v)) {
      const m = v.match(/(\+?\d[0-9]{7,14})/);
      wa = m ? m[1] : null;
    } else {
      wa = v;
    }
  }
  const normalized = normalizePhone(wa) || normalizePhone(phoneRaw);
  if (!normalized) return null;
  const digitsOnly = normalized.replace(/\D/g, '');
  if (!digitsOnly) return null;
  return `https://wa.me/${digitsOnly}`;
}

function extractPhoneFromUrl(url) {
  const u = String(url || '');
  if (!u) return null;

  // Pattern più comune: /tel-<numero> oppure varianti viste in slug (es. /tell-<numero>)
  const m1 = u.match(/\/(?:te?ll?)-([0-9]{8,13})(?:-|\b|\/|\?)/i);
  const m2 = u.match(/[?&](?:te?ll?)=([0-9]{8,13})(?:&|$)/i);
  const fromUrl = (m1 && m1[1]) || (m2 && m2[1]) || null;
  if (fromUrl) return fromUrl;

  const m3 = u.match(/\/massaggi-benessere\/(\d{8,13})(?:-|\/|\?|$)/i);
  if (m3 && m3[1]) return m3[1];

  const m4 = u.match(/\/massaggi-benessere\/([03]\d{8,10})(?=[^0-9]|$)/i);
  if (m4 && m4[1]) return m4[1];

  const slugMatches = u.match(/-(\d{9,11})(?=-|\b|\/|\?)/g) || [];
  const slugCandidates = slugMatches
    .map((s) => s.replace(/\D/g, ''))
    .filter((d) => d.length >= 9 && d.length <= 11)
    .filter((d) => d.startsWith('3') || d.startsWith('0'));
  if (slugCandidates.length) return slugCandidates[slugCandidates.length - 1];

  // Ultimo fallback (solo URL): qualsiasi sequenza 9-11 cifre plausibile IT nell'URL
  // (più sicuro del testo pagina: qui non rischiamo numeri casuali tipo prezzi)
  const any = u.match(/\d{9,11}/g) || [];
  const anyCandidate = any.find((d) => d && (d.startsWith('3') || d.startsWith('0')));
  if (anyCandidate) return anyCandidate;

  return null;
}

// Lista città usata quando CITY=ALL
const DEFAULT_CITIES = [
  'Milano',
  'Roma',
  'Torino',
  'Napoli',
  'Bologna',
  'Firenze',
];

if (!USER_ID) {
  console.error('❌ USER_ID richiesto. Esempio: USER_ID=1 node scripts/bot-bakeca-massaggi.js');
  process.exit(1);
}

async function acceptCookies(page) {
  const selectors = [
    '.iubenda-cs-accept-btn',
    '.iubenda-cs-btn-primary',
    '#onetrust-accept-btn-handler',
    '[data-testid="uc-accept-all-button"]',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    'button#accept, button.accept, button[aria-label*="accetta" i]'
  ];

  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (!el) continue;
      await el.click({ delay: 30 });
      await sleep(800);
      return;
    } catch (e) {
      // try next selector
    }
  }

  // Fallback: prova a cliccare un bottone con testo tipo "Accetta" / "Accetta tutto" / "Accept all"
  try {
    const clicked = await page.evaluate(() => {
      const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const candidates = Array.from(document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"]'));
      const wanted = [
        'accetta',
        'accetta tutto',
        'accetta tutti',
        'accetta all',
        'accept',
        'accept all',
        'consenti',
        'consenti tutti'
      ];

      for (const el of candidates) {
        const text = norm(el.innerText || el.value || '');
        if (!text) continue;
        if (wanted.some((w) => text === w || text.includes(w))) {
          (el).click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      await sleep(800);
    }
  } catch (e) {
    // ignore
  }
}

async function scrapeLista(page, url) {
  console.log(`📄 Scarico lista da: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2000);
  await acceptCookies(page);
  await sleep(1500);
  await ensureNotChallenge(page, 'lista');

  const items = await page.evaluate(() => {
    const results = [];
    const seen = new Set();

    const cleanDigits = (s) => (String(s || '').replace(/\D/g, '') || '');
    const isPlausibleIt = (d) => (d && d.length >= 9 && d.length <= 11 && (d.startsWith('3') || d.startsWith('0')));

    const anchors = Array.from(document.querySelectorAll('a[href*="/dettaglio/"]'));
    for (const a of anchors) {
      const href = a.getAttribute('href');
      if (!href) continue;
      const full = href.startsWith('http')
        ? href
        : (href.startsWith('/') ? `${window.location.origin}${href}` : `${window.location.origin}/${href}`);
      if (seen.has(full)) continue;
      seen.add(full);

      const card = a.closest('article, li, div');
      const titleEl = card ? card.querySelector('h2, h3, .title, [class*="title" i]') : null;
      const title = titleEl ? (titleEl.textContent || '').trim() : '';
      const imgEl = card ? card.querySelector('img') : null;
      const photo = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '') : '';

      let phone = null;
      if (card) {
        const telA = card.querySelector('a[href^="tel:"]');
        const telHref = telA ? telA.getAttribute('href') : null;
        if (telHref) {
          phone = cleanDigits(telHref);
        }

        if (!phone) {
          const txt = (card.innerText || '').replace(/\s+/g, ' ');
          const digits = cleanDigits(txt);
          if (digits && digits.length >= 9) {
            const matches = txt.match(/\d{9,11}/g) || [];
            const cand = matches.find((d) => isPlausibleIt(cleanDigits(d)));
            if (cand) phone = cleanDigits(cand);
          }
        }
      }

      if (phone && !isPlausibleIt(phone)) phone = null;

      results.push({ href: full, title: title || 'Centro Massaggi', photo: photo || null, phone: phone || null });
    }

    return results;
  });

  console.log(`✅ Trovati ${items.length} annunci`);
  return items;
}

async function scrapeDettaglio(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await acceptCookies(page);
  await sleep(1200);
  await ensureNotChallenge(page, 'dettaglio');

  // URL finale dopo eventuali redirect (spesso include /tel-<numero>/)
  const finalUrl = page.url();

  // Alcuni annunci caricano il telefono via XHR/FETCH dopo click su "VEDI TELEFONO"
  let netPhone = null;
  const netSeen = [];
  const responseHandler = async (response) => {
    try {
      if (netPhone) return;
      const req = response.request();
      const rt = req.resourceType();
      if (rt !== 'xhr' && rt !== 'fetch') return;
      if (response.status() < 200 || response.status() >= 300) return;
      const u = String(response.url() || '');
      // evita richieste di analytics/track
      const uLow = u.toLowerCase();
      if (uLow.includes('google') || uLow.includes('doubleclick') || uLow.includes('facebook') || uLow.includes('analytics')) return;

      // Limita quanto analizziamo per non rallentare
      if (netSeen.length < 25) netSeen.push(u);

      const text = await response.text();
      if (!text) return;

      const isPlausibleIt = (d) => (d && d.length >= 9 && d.length <= 11 && (d.startsWith('3') || d.startsWith('0')));

      // Preferisci numeri vicino a chiavi/parole "tel/telefono/phone"
      const mKey = text.match(/(?:tel|telefono|phone)[^0-9]{0,20}([03]\d{8,10})/i);
      if (mKey && isPlausibleIt(mKey[1])) {
        netPhone = mKey[1];
        return;
      }

      // Cerca un numero plausibile (IT): 9-11 cifre che iniziano con 3 o 0
      const matches = text.match(/\d{9,11}/g) || [];
      const candidate = matches.find((d) => isPlausibleIt(d));
      if (candidate) netPhone = candidate;
    } catch (e) {
      // ignore
    }
  };
  page.on('response', responseHandler);

  // Alcuni annunci mostrano il telefono solo dopo click su "VEDI TELEFONO" (modal)
  try {
    const hasTel = await page.evaluate(() => !!document.querySelector('a[href^="tel:"]'));
    if (!hasTel) {
      // Aspetta che i bottoni contatto siano renderizzati (a volte arrivano dopo)
      try {
        await page.waitForFunction(
          () => {
            const up = (s) => String(s || '').toUpperCase();
            const nodes = Array.from(document.querySelectorAll('button, a, div, span, [role="button"]'));
            return nodes.some((n) => {
              const t = up(n.textContent);
              return t.includes('VEDI TELEFONO') || t.includes('TELEFONO');
            });
          },
          { timeout: 3000 }
        );
      } catch (e) {}

      let didClick = await page.evaluate(() => {
        const up = (s) => String(s || '').toUpperCase();
        const candidates = Array.from(document.querySelectorAll('button, a, div, span, [role="button"]'));
        const el = candidates.find((n) => {
          const t = up(n.textContent);
          return t.includes('VEDI TELEFONO') || t.includes('TELEFONO');
        });
        if (!el) return false;
        if (el instanceof HTMLElement) {
          try {
            el.scrollIntoView({ block: 'center', inline: 'center' });
          } catch (e) {}
          el.click();
        }
        return true;
      });

      if (!didClick) {
        // Fallback: alcuni siti usano role="button" o contenitori non standard
        const btn = await page.$x(
          "//*[ (contains(translate(normalize-space(.), 'abcdefghijklmnopqrstuvwxyzàèéìòù', 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÈÉÌÒÙ'), 'VEDI TELEFONO') or contains(translate(normalize-space(.), 'abcdefghijklmnopqrstuvwxyzàèéìòù', 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÈÉÌÒÙ'), 'TELEFONO')) and (@role='button' or self::button or self::a or self::div or self::span)]"
        );
        if (btn && btn[0]) {
          try {
            await btn[0].evaluate((n) => n.scrollIntoView({ block: 'center', inline: 'center' }));
          } catch (e) {}
          await btn[0].click();
          await sleep(800);
          didClick = true;
        }
      }

      if (didClick) {
        await sleep(800);
        // Attendi che compaia un tel: o un numero nel modal/dialog
        await page.waitForFunction(
          () => {
            const tel = document.querySelector('a[href^="tel:"]');
            if (tel) return true;
            const dialog =
              document.querySelector('[role="dialog"]') ||
              document.querySelector('.modal, .MuiDialog-root, .ReactModal__Content, .iziModal, .iziModal-content, .popup, .popup-content');
            const root = dialog || document;
            const ds = root.querySelector('[data-phone], [data-tel], [data-telephone]');
            if (ds) return true;

            const nodes = Array.from(root.querySelectorAll('a, button, div, span, [role="button"]'));
            return nodes.some((n) => {
              const t = (n.textContent || '').trim();
              if (!t) return false;
              const digits = t.replace(/\D/g, '');
              const nonDigits = t.replace(/[0-9\s\-\.]/g, '').trim();
              return nonDigits.length === 0 && digits.length >= 8 && digits.length <= 13;
            });
          },
          { timeout: 4000 }
        );

        // In parallelo: se il numero arriva via XHR/fetch, attendi un attimo
        const startedAt = Date.now();
        while (!netPhone && Date.now() - startedAt < 3500) {
          await sleep(150);
        }
      }
    }
  } catch (e) {
    // Non bloccare lo scraping se il bottone/modal non esistono
  }

  const details = await page.evaluate(() => {
    const cleanDigits = (s) => (String(s || '').replace(/\D/g, '') || '');

    const dialog =
      document.querySelector('[role="dialog"]') ||
      document.querySelector('.modal, .MuiDialog-root, .ReactModal__Content, .iziModal, .iziModal-content, .popup, .popup-content');
    const root = dialog || document;

    // Alcuni layout mettono il numero in data-* dopo il click
    const dataNode = root.querySelector('[data-phone], [data-tel], [data-telephone]');
    const dataPhoneRaw = dataNode
      ? dataNode.getAttribute('data-phone') || dataNode.getAttribute('data-tel') || dataNode.getAttribute('data-telephone')
      : null;

    const telA = root.querySelector('a[href^="tel:"]') || document.querySelector('a[href^="tel:"]');
    const telHref = telA ? telA.getAttribute('href') : null;

    // Numero spesso è testo nel bottone contatti (come riquadro colorato)
    let phoneText = null;
    const candidates = Array.from(root.querySelectorAll('button, a, div, span, [role="button"]'));
    for (const el of candidates) {
      const t = (el.textContent || '').trim();
      if (!t) continue;
      const digits = cleanDigits(t);
      if (!digits) continue;
      const nonDigits = t.replace(/[0-9\s\-\.]/g, '').trim();
      const hasTelWord = /tel|telefono/i.test(t);
      if (nonDigits.length > 0 && !hasTelWord) continue;
      if (digits.length >= 8 && digits.length <= 13) {
        phoneText = digits;
        break;
      }
    }

    const waA = root.querySelector('a[href*="wa.me"], a[href*="whatsapp"]') || document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]');
    const waHref = waA ? waA.getAttribute('href') : null;

    return { telHref, phoneText, waHref, dataPhoneRaw };
  });

  let phone = null;
  if (details?.telHref) phone = String(details.telHref).replace(/^tel:/i, '').trim();
  if (!phone && details?.dataPhoneRaw) phone = String(details.dataPhoneRaw).trim();
  if (!phone && details?.phoneText) phone = String(details.phoneText).trim();
  if (!phone && netPhone) phone = String(netPhone).trim();

  let whatsapp = null;
  if (details?.waHref) whatsapp = String(details.waHref).trim();

  // Fallback sicuro: Bakeca spesso include il telefono direttamente nell'URL (es. /tel-3384024588-...)
  if (!phone) {
    const m1 = String(finalUrl || '').match(/\/tel-([0-9]{8,13})(?:-|\b|\/|\?)/i);
    const m2 = String(finalUrl || '').match(/[?&]tel=([0-9]{8,13})(?:&|$)/i);
    const m3 = String(finalUrl || '').match(/\/massaggi-benessere\/(\d{8,13})(?:-|\/|\?|$)/i);
    // Numero attaccato all'inizio della slug (es. /massaggi-benessere/3314794270nuovo-...)
    const m4 = String(finalUrl || '').match(/\/massaggi-benessere\/([03]\d{8,10})(?=[^0-9]|$)/i);
    const fromUrl = (m1 && m1[1]) || (m2 && m2[1]);
    const fromPath = (m3 && m3[1]) || null;
    const fromStartSlug = (m4 && m4[1]) || null;

    // Altro pattern comune: numero dentro la slug (es. ...-3315678889-...)
    const slugMatches = String(finalUrl || '').match(/-(\d{9,11})(?=-|\b|\/|\?)/g) || [];
    const slugCandidates = slugMatches
      .map((s) => s.replace(/\D/g, ''))
      .filter((d) => d.length >= 9 && d.length <= 11)
      // filtra numeri plausibili IT (cell 3xxxxxxxxx, fisso 0xxxxxxxx)
      .filter((d) => d.startsWith('3') || d.startsWith('0'));
    const fromSlug = slugCandidates.length ? slugCandidates[slugCandidates.length - 1] : null;

    if (fromUrl) phone = String(fromUrl);
    else if (fromPath && (String(fromPath).startsWith('3') || String(fromPath).startsWith('0'))) phone = String(fromPath);
    else if (fromStartSlug) phone = String(fromStartSlug);
    else if (fromSlug) phone = String(fromSlug);
  }

  phone = normalizePhone(phone);
  whatsapp = buildWhatsAppLink(phone, whatsapp);

  if (DEBUG_PHONE && !phone) {
    try {
      const path = require('path');
      const fs = require('fs');

      const outDir = __dirname;
      const safeName = Buffer.from(String(finalUrl || url)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
      const htmlPath = path.join(outDir, `debug-bakeca-phone-${safeName}.html`);
      const pngPath = path.join(outDir, `debug-bakeca-phone-${safeName}.png`);

      const html = await page.content();
      fs.writeFileSync(htmlPath, html, 'utf8');
      await page.screenshot({ path: pngPath, fullPage: true });

      console.log(`🧪 DEBUG_PHONE: phone ancora null, salvati:`);
      console.log(`🧪  - ${htmlPath}`);
      console.log(`🧪  - ${pngPath}`);
      if (netSeen.length) {
        console.log(`🧪 DEBUG_PHONE: XHR/FETCH viste (${netSeen.length}):`);
        for (const u of netSeen) console.log(`🧪   ${u}`);
      } else {
        console.log(`🧪 DEBUG_PHONE: nessuna XHR/FETCH vista (probabile click non scattato o numero non via rete)`);
      }
    } catch (e) {
      console.log(`🧪 DEBUG_PHONE: errore debug: ${e.message}`);
    }
  }

  // cleanup listener
  try {
    page.off('response', responseHandler);
  } catch (e) {}

  return { phone, whatsapp, finalUrl };
}

async function salvaAnnuncio(data, sourceUrl, city, details) {
  const sourceId = `bot_CENTRO_MASSAGGI_${Buffer.from(sourceUrl).toString('base64').slice(0, 20)}`;
  
  const exists = await prisma.quickMeeting.findFirst({
    where: { sourceId, userId: USER_ID }
  });
  
  if (exists) {
    // Aggiorna campi utili (senza fare danni): contatti e photos vuoto come richiesto
    await prisma.quickMeeting.update({
      where: { id: exists.id },
      data: {
        city: String(city || CITY).toUpperCase(),
        phone: details?.phone || null,
        whatsapp: details?.whatsapp || null,
        photos: [],
        sourceUrl: details?.finalUrl || sourceUrl,
      }
    });
    return { updated: true, id: exists.id };
  }
  
  const meeting = await prisma.quickMeeting.create({
    data: {
      title: data.title,
      description: data.title,
      category: 'CENTRO_MASSAGGI',
      city: String(city || CITY).toUpperCase(),
      phone: details?.phone || null,
      whatsapp: details?.whatsapp || null,
      photos: [],
      sourceUrl: details?.finalUrl || sourceUrl,
      sourceId,
      userId: USER_ID,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  return { created: true, id: meeting.id };
}

async function runOnce() {
  console.log(`🤖 Bot Bakeca Massaggi RUN`);
  console.log(`📊 Parametri: USER_ID=${USER_ID}, CITY=${CITY}, LIMIT=${LIMIT}`);

  const maxAds = LIMIT > 0 ? LIMIT : Number.MAX_SAFE_INTEGER;
  const maxPages = 50;

  async function collectAllPages(page, baseUrl) {
    const all = [];

    for (let pageNum = 1; pageNum <= maxPages && all.length < maxAds; pageNum++) {
      const pageUrl = pageNum === 1 ? baseUrl : `${baseUrl}?page=${pageNum}`;
      console.log(`📄 Pagina massaggi ${pageNum}: ${pageUrl}`);

      let pageItems = [];
      let lastErr = null;
      const attempts = SKIP_ON_CHALLENGE ? Math.max(1, LIST_RETRIES) : 1;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          pageItems = await scrapeLista(page, pageUrl);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          if (SKIP_ON_CHALLENGE && (isChallengeError(e) || isConnectionClosedError(e))) {
            if (attempt < attempts) {
              const waitMs = LIST_RETRY_BASE_MS * attempt + Math.floor(Math.random() * 1500);
              console.log(`🛡️ Lista bloccata (Cloudflare/rete) tentativo ${attempt}/${attempts}: ${pageUrl}`);
              console.log(`⏳ Riprovo tra ${Math.round(waitMs / 1000)}s...`);
              await sleep(waitMs);
              continue;
            }
            console.log(`🛡️ Skip lista (Cloudflare/rete): ${pageUrl}`);
            cloudflareSkipped++;
            // Stop paginazione per questa città
            break;
          }
          throw e;
        }
      }

      if (SKIP_ON_CHALLENGE && lastErr && isChallengeError(lastErr) && pageItems.length === 0) {
        break;
      }

      if (!pageItems || pageItems.length === 0) {
        if (pageNum === 1) {
          console.log(`⚠️ Nessun annuncio trovato a pagina ${pageNum}`);
        } else {
          console.log(`ℹ️ Nessun annuncio aggiuntivo a pagina ${pageNum}, stop paginazione`);
        }
        break;
      }

      for (const it of pageItems) {
        if (!all.find(x => x.href === it.href) && all.length < maxAds) {
          all.push(it);
        }
      }
    }

    return all;
  }

  const cities = CITY === 'ALL' ? DEFAULT_CITIES : [CITY];
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    ...(USER_DATA_DIR ? { userDataDir: USER_DATA_DIR } : {}),
    ...(EXECUTABLE_PATH ? { executablePath: EXECUTABLE_PATH } : {}),
    // riduce segnali di automazione (utile per Cloudflare/Turnstile)
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
      ...(PROXY_SERVER ? [`--proxy-server=${PROXY_SERVER}`] : []),
    ]
  });

  let imported = 0;
  let skipped = 0;
  let updated = 0;
  let cloudflareSkipped = 0;

  const isDetachedFrameError = (err) => {
    const msg = String(err && err.message ? err.message : err || '');
    return msg.toLowerCase().includes('detached frame');
  };

  const buildCityUrl = (city, forceBakecaincontrii) => {
    const useAlt = forceBakecaincontrii || USE_BAKECAINCONTRII;
    return useAlt
      ? `https://${city.toLowerCase()}.bakecaincontrii.com/donna-cerca-uomo/tag/massaggi-erotici/`
      : `https://www.bakeca.it/annunci/massaggi-benessere/${city.toLowerCase()}/`;
  };

  const initPage = async (p) => {
    await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    if (PROXY_USER && PROXY_PASS) {
      try {
        await p.authenticate({ username: PROXY_USER, password: PROXY_PASS });
      } catch (e) {
        console.log(`⚠️ Proxy auth fallita: ${e.message}`);
      }
    }

    // Nascondi webdriver e altri segnali comuni di automazione
    await p.evaluateOnNewDocument(() => {
      try {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      } catch (e) {}

      try {
        Object.defineProperty(navigator, 'languages', { get: () => ['it-IT', 'it', 'en-US', 'en'] });
      } catch (e) {}

      try {
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      } catch (e) {}
    });

    return p;
  };

  try {
    let page = await initPage(await browser.newPage());

    for (const city of cities) {
      const cityUrl = buildCityUrl(city, false);
      console.log(`🌍 Base URL città ${city}: ${cityUrl}`);
      let items = [];
      try {
        items = await collectAllPages(page, cityUrl);
      } catch (e) {
        // Se bakeca.it è bloccato su lista, riprova automaticamente con bakecaincontrii
        if (
          AUTO_FALLBACK_TO_BAKECAINCONTRII &&
          !USE_BAKECAINCONTRII &&
          (isChallengeError(e) || isConnectionClosedError(e) || isDetachedFrameError(e))
        ) {
          const fallbackUrl = buildCityUrl(city, true);
          console.log(`🔁 Fallback automatico su bakecaincontrii per ${city}: ${fallbackUrl}`);
          try {
            try { await page.close(); } catch (e2) {}
            page = await initPage(await browser.newPage());
            items = await collectAllPages(page, fallbackUrl);
          } catch (e2) {
            console.log(`🛡️ Skip città anche in fallback: ${fallbackUrl}`);
            cloudflareSkipped++;
            continue;
          }
        } else if (SKIP_ON_CHALLENGE && isChallengeError(e)) {
          console.log(`🛡️ Skip città (Cloudflare): ${cityUrl}`);
          cloudflareSkipped++;
          continue;
        }

        if (SKIP_ON_CHALLENGE && isChallengeError(e)) {
          console.log(`🛡️ Skip città (Cloudflare): ${cityUrl}`);
          cloudflareSkipped++;
          continue;
        }

        // Se la connessione al browser si chiude, tenta a ricreare una tab e continua con la prossima città
        if (isConnectionClosedError(e)) {
          console.log(`♻️ Browser/Page chiuso (connection closed). Ricreo la pagina e continuo: ${cityUrl}`);
          try { await page.close(); } catch (e2) {}
          try { page = await initPage(await browser.newPage()); } catch (e3) { throw e; }
          cloudflareSkipped++;
          continue;
        }

        if (isDetachedFrameError(e)) {
          console.log(`♻️ Tab corrotta (detached frame) durante la lista. Ricreo la pagina e salto città: ${cityUrl}`);
          try { await page.close(); } catch (e2) {}
          try { page = await initPage(await browser.newPage()); } catch (e3) {}
          cloudflareSkipped++;
          continue;
        }
        throw e;
      }

      if (!items || items.length === 0) {
        console.log(`⚠️ Nessun annuncio trovato per CITY=${city}`);
        continue;
      }

      for (const it of items.slice(0, LIMIT)) {
        const runForItem = async () => {
          const phoneFromUrl = extractPhoneFromUrl(it.href);
          const phoneFromList = it && it.phone ? String(it.phone) : null;
          const phoneCandidate = phoneFromUrl || phoneFromList;
          const urlDetails = phoneCandidate
            ? {
                phone: normalizePhone(phoneCandidate),
                whatsapp: buildWhatsAppLink(phoneCandidate, null),
                finalUrl: it.href,
              }
            : null;

          if (urlDetails) {
            console.log(`📞 URL-only: ${urlDetails.phone} | ${it.href}`);
          }

          const details = urlDetails || (await scrapeDettaglio(page, it.href));
          const res = await salvaAnnuncio(it, it.href, city, details);

          if (res?.updated) {
            updated++;
            console.log(`🔄 Aggiornato: ${it.title.substring(0, 50)}... (${city}) | phone=${details?.phone || 'null'} | url=${details?.finalUrl || it.href}`);
          } else {
            imported++;
            console.log(`✅ Importato: ${it.title.substring(0, 50)}... (${city}) | phone=${details?.phone || 'null'} | url=${details?.finalUrl || it.href}`);
          }
        };

        try {
          await runForItem();
        } catch (error) {
          // Puppeteer può entrare in uno stato corrotto (frame detach) dopo redirect/challenge.
          // In quel caso ricreiamo la tab e ritentiamo UNA volta.
          if (isDetachedFrameError(error)) {
            console.log(`♻️ Tab corrotta (detached frame). Ricreo la pagina e ritento: ${it.href}`);
            try { await page.close(); } catch (e) {}
            page = await initPage(await browser.newPage());
            try {
              await runForItem();
              continue;
            } catch (e2) {
              error = e2;
            }
          }

          if (SKIP_ON_CHALLENGE && isChallengeError(error)) {
            const phoneFromUrl = extractPhoneFromUrl(it.href);
            if (phoneFromUrl) {
              const details = {
                phone: normalizePhone(phoneFromUrl),
                whatsapp: buildWhatsAppLink(phoneFromUrl, null),
                finalUrl: it.href,
              };
              const res = await salvaAnnuncio(it, it.href, city, details);
              if (res?.updated) {
                updated++;
                console.log(
                  `🔄 Aggiornato (URL-only): ${it.title.substring(0, 50)}... (${city}) | phone=${details?.phone || 'null'} | url=${details?.finalUrl || it.href}`
                );
              } else {
                imported++;
                console.log(
                  `✅ Importato (URL-only): ${it.title.substring(0, 50)}... (${city}) | phone=${details?.phone || 'null'} | url=${details?.finalUrl || it.href}`
                );
              }
              cloudflareSkipped++;
              continue;
            }

            console.log(`🛡️ Skip (Cloudflare): ${it.href}`);
            skipped++;
            cloudflareSkipped++;
            continue;
          }

          // Errori di disconnessione/chiusura sessione: non rendere il run fatale
          if (isConnectionClosedError(error)) {
            console.log(`♻️ Skip (browser connection closed): ${it.href}`);
            skipped++;
            cloudflareSkipped++;
            try { page = await initPage(await browser.newPage()); } catch (e2) {}
            continue;
          }
          if (error.message === 'Già esistente') {
            console.log(`⏭️ Skip: già esistente (${city})`);
          } else {
            console.error(`❌ Errore:`, error.message);
          }
          skipped++;
        }
      }
    }
  } finally {
    await browser.close();
  }

  if (imported === 0 && updated === 0) {
    if (SKIP_ON_CHALLENGE && cloudflareSkipped > 0) {
      console.log(`\n✅ RUN completata (best-effort): Cloudflare ha bloccato alcune pagine.`);
      console.log(`🛡️ Skip Cloudflare: ${cloudflareSkipped}`);
      console.log(`📊 Importati: ${imported}`);
      console.log(`🔄 Aggiornati: ${updated}`);
      console.log(`⏭️ Saltati: ${skipped}`);
      return;
    }

    console.error(`❌ Nessun annuncio importato`);
    return;
  }

  console.log(`\n🎉 RUN COMPLETATA`);
  console.log(`📊 Importati: ${imported}`);
  console.log(`🔄 Aggiornati: ${updated}`);
  console.log(`⏭️ Saltati: ${skipped}`);
}

async function main() {
  const LOOP = process.env.LOOP === '1';
  const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || '10', 10);

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
  if (SKIP_ON_CHALLENGE && isChallengeError(err)) {
    console.log(`🛡️ Cloudflare ha bloccato l'accesso (lista/dettaglio). SKIP_ON_CHALLENGE=1 attivo: chiudo senza crash.`);
    console.log(`ℹ️ Se vedi output ripetuto, controlla che $env:LOOP sia "0" (non "1").`);
    await prisma.$disconnect();
    process.exit(0);
  }

  console.error('❌ Errore fatale:', err);
  await prisma.$disconnect();
  process.exit(1);
});
