const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

// Helper sleep compatibile con Puppeteer recente
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prisma = new PrismaClient();

class EscortAdvisorScraper {
  constructor() {
    this.baseUrl = 'https://www.escort-advisor.com';
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Inizializzazione browser...');
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // User agent per evitare detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Imposta viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async scrapeReviewsFromUrl(reviewUrl) {
    try {
      console.log(`📖 Scraping recensioni da: ${reviewUrl}`);
      
      await this.page.goto(reviewUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      
      // Attendi che la pagina carichi
      await sleep(2000);
      
      // Estrai informazioni escort
      const escortInfo = await this.page.evaluate(() => {
        const nameElement = document.querySelector('h1, .escort-name, .profile-name');
        const phoneElement = document.querySelector('.phone, .telefono, [href^="tel:"]');
        
        return {
          name: nameElement ? nameElement.textContent.trim() : 'Nome non trovato',
          phone: phoneElement ? phoneElement.textContent.replace(/[^0-9+]/g, '') : null
        };
      });

      // Estrai recensioni
      const reviews = await this.page.evaluate(() => {
        const reviewElements = document.querySelectorAll('.review, .recensione, .comment');
        const reviews = [];

        reviewElements.forEach(element => {
          const reviewerName = element.querySelector('.reviewer-name, .nome-recensore, .author')?.textContent?.trim();
          const reviewText = element.querySelector('.review-text, .testo-recensione, .content')?.textContent?.trim();
          const ratingElement = element.querySelector('.rating, .stelle, .stars');
          const dateElement = element.querySelector('.date, .data, .timestamp');
          
          let rating = null;
          if (ratingElement) {
            // Cerca stelle o numeri
            const ratingText = ratingElement.textContent;
            const ratingMatch = ratingText.match(/(\d+)/);
            if (ratingMatch) rating = parseInt(ratingMatch[1]);
          }

          let reviewDate = null;
          if (dateElement) {
            const dateText = dateElement.textContent.trim();
            // Prova a parsare la data
            const parsedDate = new Date(dateText);
            if (!isNaN(parsedDate)) reviewDate = parsedDate.toISOString();
          }

          if (reviewText && reviewText.length > 10) {
            reviews.push({
              reviewerName,
              reviewText,
              rating,
              reviewDate
            });
          }
        });

        return reviews;
      });

      console.log(`✅ Trovate ${reviews.length} recensioni per ${escortInfo.name}`);

      // Salva nel database
      for (const review of reviews) {
        const sourceId = `ea_${Buffer.from(reviewUrl + review.reviewText).toString('base64').slice(0, 20)}`;
        
        try {
          await prisma.importedReview.upsert({
            where: { sourceId },
            update: {},
            create: {
              escortName: escortInfo.name,
              escortPhone: escortInfo.phone,
              reviewerName: review.reviewerName,
              rating: review.rating,
              reviewText: review.reviewText,
              reviewDate: review.reviewDate ? new Date(review.reviewDate) : null,
              sourceUrl: reviewUrl,
              sourceId
            }
          });
        } catch (error) {
          console.error(`❌ Errore salvando recensione: ${error.message}`);
        }
      }

      return { escortInfo, reviews };
    } catch (error) {
      console.error(`❌ Errore scraping ${reviewUrl}: ${error.message}`);
      return null;
    }
  }

  async searchEscorts(city = 'milano', limit = 50) {
    try {
      console.log(`🔍 Cercando escort in ${city}...`);
      
      const searchUrl = `${this.baseUrl}/ricerca?citta=${encodeURIComponent(city)}`;
      await this.page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      
      // Estrai link ai profili
      const profileLinks = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/recensioni/"], a[href*="/profilo/"]'));
        return links.map(link => link.href).filter(href => href.includes('/recensioni/'));
      });

      console.log(`📋 Trovati ${profileLinks.length} profili con recensioni`);

      const results = [];
      for (let i = 0; i < Math.min(profileLinks.length, limit); i++) {
        const link = profileLinks[i];
        console.log(`📖 Processando ${i + 1}/${Math.min(profileLinks.length, limit)}: ${link}`);
        
        const result = await this.scrapeReviewsFromUrl(link);
        if (result) results.push(result);
        
        // Pausa tra le richieste per evitare rate limiting
        await sleep(2000 + Math.random() * 3000);
      }

      return results;
    } catch (error) {
      console.error(`❌ Errore ricerca escort: ${error.message}`);
      return [];
    }
  }

  async processReviews() {
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
    
    // Città italiane principali
    const cities = ['milano', 'roma', 'torino', 'napoli', 'bologna', 'firenze'];
    
    for (const city of cities) {
      console.log(`\n🏙️ === PROCESSANDO ${city.toUpperCase()} ===`);
      await scraper.searchEscorts(city, 20); // 20 profili per città
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
