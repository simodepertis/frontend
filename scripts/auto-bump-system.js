const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const prisma = new PrismaClient();

class AutoBumpSystem {
  constructor() {
    this.isRunning = false;
  }

  async processBumps() {
    if (this.isRunning) {
      console.log('⏳ Bump già in corso, salto questa esecuzione');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Inizio processo di bump automatico...');

    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:00-${(currentHour + 1).toString().padStart(2, '0')}:00`;
      
      console.log(`⏰ Ora corrente: ${now.toLocaleString()}, Fascia: ${currentTimeSlot}`);

      // Trova annunci da bumpare
      const adsToBump = await prisma.quickMeeting.findMany({
        where: {
          isActive: true,
          nextBumpAt: {
            lte: now
          },
          bumpCount: {
            lt: prisma.quickMeeting.fields.maxBumps
          }
        },
        orderBy: {
          nextBumpAt: 'asc'
        },
        take: 100
      });

      console.log(`📋 Trovati ${adsToBump.length} annunci da bumpare`);

      for (const ad of adsToBump) {
        try {
          await this.bumpAd(ad, currentTimeSlot);
        } catch (error) {
          console.error(`❌ Errore bump annuncio ${ad.id}: ${error.message}`);
          
          // Log errore
          await prisma.bumpLog.create({
            data: {
              quickMeetingId: ad.id,
              timeSlot: currentTimeSlot,
              success: false,
              error: error.message
            }
          });
        }
      }

      console.log('✅ Processo di bump completato');
    } catch (error) {
      console.error('❌ Errore generale bump system:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async bumpAd(ad, currentTimeSlot) {
    const now = new Date();
    
    // Verifica se è la fascia oraria corretta
    const isCorrectTimeSlot = this.isCorrectTimeSlot(ad, currentTimeSlot);
    
    if (!isCorrectTimeSlot && !ad.bumpPackage?.includes('x')) {
      console.log(`⏭️ Annuncio ${ad.id} non nella fascia corretta (${ad.bumpTimeSlot} vs ${currentTimeSlot})`);
      return;
    }

    console.log(`🔄 Bumpando annuncio: ${ad.title} (${ad.bumpPackage})`);

    // Calcola prossimo bump
    const nextBumpAt = this.calculateNextBump(ad);

    // Aggiorna annuncio
    await prisma.quickMeeting.update({
      where: { id: ad.id },
      data: {
        publishedAt: now, // Risale in prima pagina
        bumpCount: ad.bumpCount + 1,
        lastBumpAt: now,
        nextBumpAt: nextBumpAt,
        // Se ha raggiunto il massimo, disattiva
        isActive: ad.bumpCount + 1 < ad.maxBumps
      }
    });

    // Log successo
    await prisma.bumpLog.create({
      data: {
        quickMeetingId: ad.id,
        timeSlot: currentTimeSlot,
        success: true
      }
    });

    console.log(`✅ Bump completato per ${ad.title} (${ad.bumpCount + 1}/${ad.maxBumps})`);
  }

  isCorrectTimeSlot(ad, currentTimeSlot) {
    if (!ad.bumpTimeSlot) return true;
    
    // Per pacchetti notturni (1x10, 1x3), accetta qualsiasi ora tra 00:00-08:00
    if (ad.bumpPackage?.includes('x')) {
      const currentHour = parseInt(currentTimeSlot.split(':')[0]);
      return currentHour >= 0 && currentHour < 8;
    }
    
    // Per pacchetti diurni, deve essere la fascia esatta
    return ad.bumpTimeSlot === currentTimeSlot;
  }

  calculateNextBump(ad) {
    const now = new Date();
    const nextBump = new Date(now);

    if (ad.bumpPackage === '1+1') {
      // Ogni giorno alla stessa ora
      nextBump.setDate(nextBump.getDate() + 1);
    } else if (ad.bumpPackage === '1+3') {
      // Ogni giorno per 4 giorni totali
      nextBump.setDate(nextBump.getDate() + 1);
    } else if (ad.bumpPackage === '1+7') {
      // Ogni giorno per 8 giorni totali
      nextBump.setDate(nextBump.getDate() + 1);
    } else if (ad.bumpPackage === '1x10') {
      // 10 volte durante la notte (ogni 48 minuti circa)
      nextBump.setMinutes(nextBump.getMinutes() + 48);
      
      // Se supera le 8:00, vai alla prossima notte
      if (nextBump.getHours() >= 8) {
        nextBump.setDate(nextBump.getDate() + 1);
        nextBump.setHours(0, 0, 0, 0);
      }
    } else if (ad.bumpPackage === '1x3') {
      // 3 volte durante la notte (ogni 2.5 ore circa)
      nextBump.setHours(nextBump.getHours() + 2, nextBump.getMinutes() + 40);
      
      // Se supera le 8:00, vai alla prossima notte
      if (nextBump.getHours() >= 8) {
        nextBump.setDate(nextBump.getDate() + 1);
        nextBump.setHours(0, 0, 0, 0);
      }
    }

    // Se ha raggiunto il massimo, non programmare più bump
    if (ad.bumpCount + 1 >= ad.maxBumps) {
      return null;
    }

    return nextBump;
  }

  async cleanupExpiredAds() {
    try {
      console.log('🧹 Pulizia annunci scaduti...');
      
      const now = new Date();
      const result = await prisma.quickMeeting.updateMany({
        where: {
          OR: [
            { expiresAt: { lte: now } },
            { 
              AND: [
                { bumpCount: { gte: prisma.quickMeeting.fields.maxBumps } },
                { maxBumps: { gt: 0 } }
              ]
            }
          ]
        },
        data: {
          isActive: false
        }
      });

      console.log(`🗑️ Disattivati ${result.count} annunci scaduti`);
    } catch (error) {
      console.error('❌ Errore pulizia annunci:', error);
    }
  }

  async getStats() {
    try {
      const stats = await prisma.quickMeeting.groupBy({
        by: ['category', 'isActive'],
        _count: true
      });

      const bumpStats = await prisma.bumpLog.groupBy({
        by: ['success'],
        where: {
          bumpedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Ultime 24 ore
          }
        },
        _count: true
      });

      console.log('📊 Statistiche annunci:', stats);
      console.log('📊 Statistiche bump (24h):', bumpStats);
    } catch (error) {
      console.error('❌ Errore statistiche:', error);
    }
  }

  startScheduler() {
    console.log('⏰ Avvio scheduler bump automatico...');

    // Ogni 15 minuti controlla bump da fare
    cron.schedule('*/15 * * * *', async () => {
      await this.processBumps();
    });

    // Ogni ora pulisci annunci scaduti
    cron.schedule('0 * * * *', async () => {
      await this.cleanupExpiredAds();
    });

    // Ogni 6 ore mostra statistiche
    cron.schedule('0 */6 * * *', async () => {
      await this.getStats();
    });

    console.log('✅ Scheduler avviato');
    console.log('- Bump check: ogni 15 minuti');
    console.log('- Pulizia: ogni ora');
    console.log('- Stats: ogni 6 ore');
  }

  async stop() {
    console.log('🛑 Fermando bump system...');
    await prisma.$disconnect();
  }
}

// Funzione principale
async function main() {
  const bumpSystem = new AutoBumpSystem();
  
  try {
    // Esegui un ciclo di bump immediato
    await bumpSystem.processBumps();
    await bumpSystem.cleanupExpiredAds();
    await bumpSystem.getStats();
    
    // Avvia scheduler se in modalità daemon
    if (process.argv.includes('--daemon')) {
      bumpSystem.startScheduler();
      
      // Gestisci chiusura pulita
      process.on('SIGINT', async () => {
        console.log('\n🛑 Ricevuto SIGINT, chiusura in corso...');
        await bumpSystem.stop();
        process.exit(0);
      });
      
      console.log('🔄 Bump system in modalità daemon. Premi Ctrl+C per fermare.');
      
      // Mantieni il processo attivo
      setInterval(() => {}, 1000);
    }
    
  } catch (error) {
    console.error('❌ Errore bump system:', error);
    await bumpSystem.stop();
    process.exit(1);
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutoBumpSystem;
