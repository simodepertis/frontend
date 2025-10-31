const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { PrismaClient } = require('@prisma/client');

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();

/**
 * Scraper COMPLETO per Bakecaincontrii.com
 * Estrae: titolo, descrizione, telefono, WhatsApp, età, prezzo, zona, TUTTE le foto
 */

class BakecaScraperCompleto {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  // Helper per delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async init() {
    console.log('🚀 Avvio Bakeca Scraper Completo...\n');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ]
    });

    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  }

  async scrapeCategory(url, category, city) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📂 Categoria: ${category}`);
    console.log(`🌐 URL: ${url}`);
    console.log('='.repeat(60) + '\n');

    try {
      // 1. Carica la lista annunci
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await this.delay(2000);

      // 2. Estrai link annunci
      const adLinks = await this.page.evaluate(() => {
        const links = [];
        const anchors = document.querySelectorAll('a[href*="/escort/"], a[href*="/trans/"], a[href*="/gay/"], a[href*="/dettaglio/"]');
        
        anchors.forEach(a => {
          const href = a.href;
          if (href && !links.includes(href) && href.includes('bakeca')) {
            links.push(href);
          }
        });
        
        return links;
      });

      console.log(`✅ Trovati ${adLinks.length} link annunci\n`);

      if (adLinks.length === 0) {
        console.log('⚠️ Nessun annuncio trovato, provo cookie banner...');
        await this.handleCookieBanner();
        return await this.scrapeCategory(url, category, city);
      }

      // 3. Visita ogni annuncio e estrai dati completi
      let scraped = 0;
      const limit = Math.min(adLinks.length, 30);

      for (let i = 0; i < limit; i++) {
        const adUrl = adLinks[i];
        try {
          console.log(`\n[${i + 1}/${limit}] 🔍 Analisi: ${adUrl}`);
          
          const adData = await this.scrapeAdDetail(adUrl, category, city);
          
          if (adData) {
            await this.saveAd(adData);
            scraped++;
            console.log(`   ✅ Salvato: "${adData.title}"`);
          } else {
            console.log(`   ⏭️  Saltato (dati incompleti)`);
          }

          // Pausa tra richieste
          await this.delay(1000 + Math.random() * 2000);

        } catch (error) {
          console.log(`   ❌ Errore: ${error.message}`);
        }
      }

      console.log(`\n✅ Completato: ${scraped}/${limit} annunci salvati`);

    } catch (error) {
      console.error(`❌ Errore categoria: ${error.message}`);
    }
  }

  async scrapeAdDetail(url, category, city) {
    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      await this.delay(1500);

      // Estrai TUTTI i dati dalla pagina dettaglio
      const adData = await this.page.evaluate(() => {
        // Titolo
        const titleEl = document.querySelector('h1, .title, [class*="title"]');
        const title = titleEl ? titleEl.textContent.trim() : '';

        // Descrizione
        const descEl = document.querySelector('.description, [class*="desc"], .text, p');
        const description = descEl ? descEl.textContent.trim() : '';

        // Telefono
        let phone = null;
        const phoneEl = document.querySelector('a[href^="tel:"], .phone, [class*="phone"], [class*="telefono"]');
        if (phoneEl) {
          const phoneText = phoneEl.textContent || phoneEl.href;
          const phoneMatch = phoneText.match(/[\d\s\+\-\(\)]{9,}/);
          if (phoneMatch) phone = phoneMatch[0].trim();
        }

        // WhatsApp
        let whatsapp = null;
        const waEl = document.querySelector('a[href*="wa.me"], a[href*="whatsapp"], [class*="whatsapp"]');
        if (waEl) {
          const waHref = waEl.href;
          const waMatch = waHref.match(/(?:wa\.me\/|phone=)(\d+)/);
          if (waMatch) whatsapp = `https://wa.me/${waMatch[1]}`;
        }

        // Età
        let age = null;
        const ageText = document.body.textContent;
        const ageMatch = ageText.match(/(\d{2})\s*anni|età\s*(\d{2})/i);
        if (ageMatch) age = parseInt(ageMatch[1] || ageMatch[2]);

        // Prezzo
        let price = null;
        const priceEl = document.querySelector('.price, [class*="price"], [class*="prezzo"]');
        if (priceEl) {
          const priceText = priceEl.textContent;
          const priceMatch = priceText.match(/(\d+)/);
          if (priceMatch) price = parseInt(priceMatch[1]);
        }

        // Zona/Quartiere
        let zone = null;
        const zoneEl = document.querySelector('.location, .zone, [class*="zona"], [class*="location"]');
        if (zoneEl) zone = zoneEl.textContent.trim();

        // TUTTE le foto
        const photos = [];
        const imgElements = document.querySelectorAll('img[src*="bakeca"], img[data-src*="bakeca"], .gallery img, [class*="photo"] img, [class*="image"] img');
        
        imgElements.forEach(img => {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy');
          if (src && src.includes('bakeca') && !photos.includes(src)) {
            // Prendi versione alta qualità
            const hqSrc = src.replace(/\/thumb\//, '/').replace(/_small\./, '_large.');
            photos.push(hqSrc);
          }
        });

        return {
          title,
          description,
          phone,
          whatsapp,
          age,
          price,
          zone,
          photos
        };
      });

      // Validazione dati minimi
      if (!adData.title || adData.title.length < 3) {
        return null;
      }

      // Aggiungi metadati
      adData.sourceUrl = url;
      adData.category = category;
      adData.city = city;

      return adData;

    } catch (error) {
      console.error(`Errore scraping dettaglio: ${error.message}`);
      return null;
    }
  }

  async saveAd(adData) {
    try {
      const sourceId = `bkc_${adData.category}_${Buffer.from(adData.sourceUrl).toString('base64').slice(0, 20)}`;

      const existing = await prisma.quickMeeting.findFirst({
        where: { sourceId }
      });

      if (existing) {
        console.log('   ℹ️  Già esistente, aggiorno...');
        await prisma.quickMeeting.update({
          where: { id: existing.id },
          data: {
            title: adData.title,
            description: adData.description || adData.title,
            phone: adData.phone,
            whatsapp: adData.whatsapp,
            age: adData.age,
            price: adData.price,
            zone: adData.zone,
            photos: adData.photos.length > 0 ? adData.photos : [],
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.quickMeeting.create({
          data: {
            title: adData.title,
            description: adData.description || adData.title,
            category: adData.category,
            city: adData.city.toUpperCase(),
            zone: adData.zone,
            phone: adData.phone,
            whatsapp: adData.whatsapp,
            age: adData.age,
            price: adData.price,
            photos: adData.photos.length > 0 ? adData.photos : [],
            sourceUrl: adData.sourceUrl,
            sourceId,
            userId: null, // Importato da bot
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
          }
        });
      }
    } catch (error) {
      console.error(`Errore salvataggio: ${error.message}`);
    }
  }

  async handleCookieBanner() {
    try {
      const cookieButtons = await this.page.$$('button, a');
      for (const btn of cookieButtons) {
        const text = await this.page.evaluate(el => el.textContent, btn);
        if (text.match(/accetta|accept|continua|ok/i)) {
          await btn.click();
          await this.delay(1000);
          break;
        }
      }
    } catch (e) {
      // Ignora errori
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    await prisma.$disconnect();
  }
}

// === ESECUZIONE ===
async function main() {
  const scraper = new BakecaScraperCompleto();
  
  try {
    await scraper.init();

    const targets = [
      {
        url: 'https://www.bakecaincontrii.com/escort/milano/',
        category: 'DONNA_CERCA_UOMO',
        city: 'MILANO'
      },
      {
        url: 'https://www.bakecaincontrii.com/trans/milano/',
        category: 'TRANS',
        city: 'MILANO'
      },
      {
        url: 'https://www.bakecaincontrii.com/gay/milano/',
        category: 'UOMO_CERCA_UOMO',
        city: 'MILANO'
      }
    ];

    for (const target of targets) {
      await scraper.scrapeCategory(target.url, target.category, target.city);
      await scraper.delay(3000); // Pausa tra categorie
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Scraping completato!');
    console.log('='.repeat(60));

    // Statistiche finali
    const total = await prisma.quickMeeting.count({
      where: { userId: null } // Solo bot-imported
    });
    console.log(`\n📊 Totale annunci importati dal bot: ${total}`);

  } catch (error) {
    console.error('❌ Errore fatale:', error);
  } finally {
    await scraper.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
