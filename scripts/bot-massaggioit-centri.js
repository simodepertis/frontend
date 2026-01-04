/**
 * Bot MassaggioIT - Importa annunci "Centro massaggi" da massaggioit.com
 *
 * Uso: node scripts/bot-massaggioit-centri.js
 *
 * Parametri opzionali:
 * - USER_ID: ID utente (richiesto)
 * - CITY: Milano (default)
 * - LIMIT: 20 (default)
 * - TAGS: centri (default)
 */

const { PrismaClient } = require('@prisma/client');
const { fetch } = require('undici');
const cheerio = require('cheerio');
const crypto = require('crypto');

const prisma = new PrismaClient();

const USER_ID = process.env.USER_ID ? parseInt(process.env.USER_ID, 10) : null;
const CITY = process.env.CITY || 'Milano';
const LIMIT = parseInt(process.env.LIMIT || '20', 10);
const LIMIT_PER_CITY = parseInt(process.env.LIMIT_PER_CITY || '', 10);
const TAGS = process.env.TAGS || 'centri';

const ALL_CITIES = [
  "Agrigento",
  "Alessandria",
  "Ancona",
  "Aosta",
  "Arezzo",
  "Ascoli",
  "Asti",
  "Avellino",
  "Bari",
  "Barletta",
  "Belluno",
  "Benevento",
  "Bergamo",
  "Biella",
  "Bologna",
  "Bolzano",
  "Brescia",
  "Brindisi",
  "Cagliari",
  "Caltanissetta",
  "Campobasso",
  "Carbonia Inglesias",
  "Caserta",
  "Catania",
  "Catanzaro",
  "Chieti",
  "Como",
  "Cosenza",
  "Cremona",
  "Crotone",
  "Cuneo",
  "Enna",
  "Fermo",
  "Ferrara",
  "Firenze",
  "Foggia",
  "Forlì",
  "Frosinone",
  "Genova",
  "Gorizia",
  "Grosseto",
  "Imperia",
  "Iserni",
  "L'aquila",
  "La Spezia",
  "Latina",
  "Lecce",
  "Lecco",
  "livorno",
  "Lodi",
  "Lucca",
  "Macerata",
  "Mantova",
  "Massa Carrara",
  "Matera",
  "Medio Campidano",
  "Messina",
  "Milano",
  "Modena",
  "Monza",
  "Napoli",
  "Novara",
  "Nuoro",
  "Ogliastra",
  "Olbia Tempio",
  "Oristano",
  "Padova",
  "Palermo",
  "Parma",
  "Pavia",
  "Perugia",
  "Pescara",
  "Piacenza",
  "Pisa",
  "Pistoia",
  "Pordenone",
  "Potenta",
  "Prato",
  "Ragusa",
  "Ravenna",
  "Reggio Calabria",
  "Reggio Emilia",
  "Rimini",
  "Rieti",
  "ROMA",
  "Rovigo",
  "Salerno",
  "Sassari",
  "Savona",
  "Siena",
  "Siracusa",
  "Sondrio",
  "Taranto",
  "Teramo",
  "Terni",
  "Torino",
  "Trapani",
  "Trento",
  "Treviso",
  "Trieste",
  "Udine",
  "Urbino",
  "Varese",
  "Venezia",
  "Verbania",
  "Vercelli",
  "Verona",
  "Vibo Valentia",
  "Vicenza",
  "Viterb",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function sha1(input) {
  return crypto.createHash('sha1').update(String(input || '')).digest('hex');
}

function isMassaggioItAdUrl(href) {
  const h = String(href || '');
  return /^https?:\/\/massaggioit\.com\/[0-9]{6,12}_i[0-9]+/i.test(h);
}

function absolutize(base, href) {
  const h = String(href || '').trim();
  if (!h) return null;
  if (/^https?:\/\//i.test(h)) return h;
  if (h.startsWith('/')) return `${base}${h}`;
  return `${base}/${h}`;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} su ${url}`);
  }

  const html = await res.text();
  return html;
}

function extractPhoneAndWhatsappFromText(text) {
  const t = String(text || '');
  const phones = t.match(/\b[03]\d{8,10}\b/g) || [];

  let phone = phones.length ? phones[0] : null;
  if (phone) phone = normalizePhone(phone);

  let whatsapp = null;
  const waLink = t.match(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s"']+/i);
  if (waLink && waLink[0]) whatsapp = waLink[0];
  if (!whatsapp && t.toLowerCase().includes('whatsapp')) {
    const near = t.match(/whatsapp[^0-9]{0,40}([03]\d{8,10})/i);
    if (near && near[1]) whatsapp = near[1];
  }

  const waUrl = buildWhatsAppLink(phone, whatsapp);
  const normalizedPhone = normalizePhone(phone) || normalizePhone(whatsapp);

  return {
    phone: normalizedPhone,
    whatsapp: waUrl,
  };
}

function cleanText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

async function scrapeList(city, tags) {
  const base = 'https://massaggioit.com';
  const url = `${base}/${encodeURIComponent(String(city || '').toLowerCase())}?tags=${encodeURIComponent(tags)}`;

  console.log(`📄 Scarico lista: ${url}`);
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const full = absolutize(base, href);
    if (!full) return;
    if (!isMassaggioItAdUrl(full)) return;
    if (!links.includes(full)) links.push(full);
  });

  return links;
}

async function scrapeDetail(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title = cleanText($('h1').first().text()) || cleanText($('title').text());

  const metaDesc = $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  const bodyText = cleanText($('body').text());
  const description = cleanText(metaDesc) || bodyText.slice(0, 1200);

  const { phone, whatsapp } = extractPhoneAndWhatsappFromText(bodyText);

  const mapsHref = $('a[href*="maps.google.com"]').first().attr('href') || null;

  return {
    title: title || 'Centro Massaggi',
    description: description || title || 'Centro Massaggi',
    phone,
    whatsapp,
    photos: [],
    sourceUrl: url,
    mapsHref,
  };
}

async function upsertQuickMeeting(data, userId, city) {
  const sourceId = `massaggioit_${sha1(data.sourceUrl).slice(0, 24)}`;
  const cityNorm = String(city || CITY).toUpperCase();
  const phoneNorm = normalizePhone(data.phone) || null;
  const waNorm = data.whatsapp ? String(data.whatsapp).trim() : null;

  const existsBySource = await prisma.quickMeeting.findFirst({ where: { sourceId } });

  // Deduplica aggiuntiva (anti-duplicati reali): stesso contatto nella stessa città/categoria
  // MassaggioIT spesso ripubblica lo stesso annuncio con URL diverso.
  const existsByContact = (!existsBySource && (phoneNorm || waNorm))
    ? await prisma.quickMeeting.findFirst({
        where: {
          category: 'CENTRO_MASSAGGI',
          city: cityNorm,
          OR: [
            ...(phoneNorm ? [{ phone: phoneNorm }] : []),
            ...(waNorm ? [{ whatsapp: waNorm }] : []),
          ],
        },
      })
    : null;

  const exists = existsBySource || existsByContact;

  const payload = {
    title: data.title,
    description: data.description,
    category: 'CENTRO_MASSAGGI',
    city: cityNorm,
    phone: phoneNorm,
    whatsapp: waNorm,
    photos: [],
    sourceUrl: data.sourceUrl,
    sourceId,
    userId: userId || null,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  if (exists) {
    await prisma.quickMeeting.update({
      where: { id: exists.id },
      data: payload,
    });
    return { updated: true, id: exists.id, reason: existsBySource ? 'sourceId' : 'contact' };
  }

  const created = await prisma.quickMeeting.create({ data: payload });
  return { created: true, id: created.id };
}

async function main() {
  let resolvedUserId = USER_ID;
  if (resolvedUserId) {
    try {
      const u = await prisma.user.findUnique({ where: { id: resolvedUserId }, select: { id: true } });
      if (!u) {
        console.log(`⚠️ USER_ID=${resolvedUserId} non esiste nel DB: salvo i QuickMeeting con userId=null`);
        resolvedUserId = null;
      }
    } catch (e) {
      console.log(`⚠️ Impossibile verificare USER_ID nel DB: salvo i QuickMeeting con userId=null (${e?.message || e})`);
      resolvedUserId = null;
    }
  } else {
    console.log('ℹ️ USER_ID non impostato: salvo i QuickMeeting con userId=null');
  }

  console.log('🤖 Bot MassaggioIT (centri) RUN');
  const perCityLimit = Number.isFinite(LIMIT_PER_CITY) ? LIMIT_PER_CITY : LIMIT;
  console.log(`📊 Parametri: USER_ID=${resolvedUserId || 'null'}, CITY=${CITY}, LIMIT=${LIMIT}, LIMIT_PER_CITY=${perCityLimit}, TAGS=${TAGS}`);

  const citiesToRun = String(CITY || '').toUpperCase() === 'ALL' ? ALL_CITIES : [CITY];

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const city of citiesToRun) {
    const links = await scrapeList(city, TAGS).catch((e) => {
      console.log(`❌ Errore lista CITY=${city}: ${e?.message || e}`);
      return [];
    });

    if (!links.length) {
      console.log(`ℹ️ Nessun annuncio trovato in lista per CITY=${city}`);
      continue;
    }

    console.log(`✅ CITY=${city}: trovati ${links.length} link (ne processo max ${perCityLimit})`);

    for (const url of links.slice(0, perCityLimit)) {
      try {
        const d = await scrapeDetail(url);

        if (!d.phone && !d.whatsapp) {
          skipped++;
          continue;
        }

        const res = await upsertQuickMeeting(d, resolvedUserId, city);
        if (res.updated) {
          updated++;
          console.log(`🔄 Aggiornato: CITY=${city} | ${d.title.substring(0, 60)}... | ${d.phone || ''} | ${d.sourceUrl}`);
        } else {
          imported++;
          console.log(`✅ Importato: CITY=${city} | ${d.title.substring(0, 60)}... | ${d.phone || ''} | ${d.sourceUrl}`);
        }

        await sleep(250);
      } catch (e) {
        skipped++;
        console.log(`❌ Errore su ${url}: ${e.message}`);
      }
    }

    await sleep(400);
  }

  console.log('\n🎉 RUN COMPLETATA');
  console.log(`📊 Importati: ${imported}`);
  console.log(`🔄 Aggiornati: ${updated}`);
  console.log(`⏭️ Saltati: ${skipped}`);
}

main()
  .catch((err) => {
    console.error('❌ Errore nel bot MassaggioIT:', err);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {}
  });
