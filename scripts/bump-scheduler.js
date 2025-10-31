/**
 * Scheduler BUMP - Fa risalire annunci in prima pagina automaticamente
 * 
 * Uso: node scripts/bump-scheduler.js
 * 
 * Gira in loop ogni minuto e controlla gli annunci che devono fare bump.
 * 
 * Pacchetti supportati:
 * - 1+1: 2 giorni, 1 risalita iniziale + 1 bump
 * - 1+3: 4 giorni, 1 risalita iniziale + 3 bump
 * - 1+7: 8 giorni, 1 risalita iniziale + 7 bump
 * - 1x10: 10 risalite notturne (00:00-08:00)
 * - 1x3: 3 risalite notturne (00:00-08:00)
 * 
 * Fasce orarie diurne:
 * 08:00-09:00, 09:00-10:00, ..., 23:00-00:00
 * 
 * Fascia notturna: 00:00-08:00
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INTERVAL_MS = 60 * 1000; // 1 minuto

function parseTimeSlot(slot) {
  if (!slot) return null;
  const [start] = slot.split('-');
  const [hour, minute] = start.split(':').map(n => parseInt(n, 10));
  return { hour, minute };
}

function isInTimeSlot(now, slot) {
  const parsed = parseTimeSlot(slot);
  if (!parsed) return false;
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Per fasce orarie precise (es. 08:00-09:00)
  return currentHour === parsed.hour;
}

function isNightTime(now) {
  const hour = now.getHours();
  return hour >= 0 && hour < 8; // 00:00-08:00
}

function calculateNextBump(bumpPackage, bumpTimeSlot, now) {
  // Pacchetti notturni: bump casuale tra 00:00 e 08:00
  if (bumpPackage === '1x10' || bumpPackage === '1x3') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
    return tomorrow;
  }
  
  // Pacchetti diurni: bump nella stessa fascia oraria
  if (!bumpTimeSlot) return null;
  
  const parsed = parseTimeSlot(bumpTimeSlot);
  if (!parsed) return null;
  
  const next = new Date(now);
  
  // Calcola giorni di intervallo in base al pacchetto
  let intervalDays = 0;
  if (bumpPackage === '1+1') intervalDays = 2;
  else if (bumpPackage === '1+3') intervalDays = 1; // bump più frequenti
  else if (bumpPackage === '1+7') intervalDays = 1; // bump più frequenti
  
  next.setDate(next.getDate() + intervalDays);
  next.setHours(parsed.hour, parsed.minute, 0, 0);
  
  return next;
}

async function processBumps() {
  const now = new Date();
  console.log(`\n⏰ ${now.toLocaleString('it-IT')} - Controllo bump...`);
  
  try {
    // Trova annunci che devono fare bump ADESSO
    const toBump = await prisma.quickMeeting.findMany({
      where: {
        AND: [
          { isActive: true },
          { bumpPackage: { not: null } },
          { OR: [
            { nextBumpAt: { lte: now } },
            { nextBumpAt: null }
          ]},
          { OR: [
            { bumpCount: { lt: prisma.quickMeeting.fields.maxBumps } },
            { maxBumps: 0 }
          ]}
        ]
      },
      take: 100
    });
    
    if (toBump.length === 0) {
      console.log('✅ Nessun annuncio da bumpare');
      return;
    }
    
    console.log(`📊 Trovati ${toBump.length} annunci da processare`);
    
    let bumped = 0;
    let skipped = 0;
    
    for (const meeting of toBump) {
      try {
        // Verifica fascia oraria
        const isNight = isNightTime(now);
        const isNightPackage = meeting.bumpPackage === '1x10' || meeting.bumpPackage === '1x3';
        
        // Pacchetti notturni: solo 00:00-08:00
        if (isNightPackage && !isNight) {
          skipped++;
          continue;
        }
        
        // Pacchetti diurni: solo nella fascia scelta
        if (!isNightPackage && meeting.bumpTimeSlot && !isInTimeSlot(now, meeting.bumpTimeSlot)) {
          skipped++;
          continue;
        }
        
        // Calcola maxBumps se non impostato
        let maxBumps = meeting.maxBumps;
        if (maxBumps === 0) {
          if (meeting.bumpPackage === '1+1') maxBumps = 1;
          else if (meeting.bumpPackage === '1+3') maxBumps = 3;
          else if (meeting.bumpPackage === '1+7') maxBumps = 7;
          else if (meeting.bumpPackage === '1x10') maxBumps = 10;
          else if (meeting.bumpPackage === '1x3') maxBumps = 3;
        }
        
        // Controlla se ha ancora bump disponibili
        if (meeting.bumpCount >= maxBumps) {
          console.log(`⏭️ #${meeting.id}: bump esauriti (${meeting.bumpCount}/${maxBumps})`);
          skipped++;
          continue;
        }
        
        // BUMP! Aggiorna publishedAt per far risalire in prima pagina
        const nextBump = calculateNextBump(meeting.bumpPackage, meeting.bumpTimeSlot, now);
        
        await prisma.quickMeeting.update({
          where: { id: meeting.id },
          data: {
            publishedAt: now, // ⭐ Risale in prima pagina
            lastBumpAt: now,
            nextBumpAt: nextBump,
            bumpCount: meeting.bumpCount + 1,
            maxBumps: maxBumps
          }
        });
        
        // Log bump
        await prisma.bumpLog.create({
          data: {
            quickMeetingId: meeting.id,
            bumpedAt: now,
            timeSlot: meeting.bumpTimeSlot || 'NIGHT',
            success: true
          }
        });
        
        bumped++;
        console.log(`✅ #${meeting.id}: BUMPED! (${meeting.bumpCount + 1}/${maxBumps}) - next: ${nextBump?.toLocaleString('it-IT') || 'N/A'}`);
        
      } catch (error) {
        console.error(`❌ Errore bump #${meeting.id}:`, error.message);
        
        // Log errore
        await prisma.bumpLog.create({
          data: {
            quickMeetingId: meeting.id,
            bumpedAt: now,
            timeSlot: meeting.bumpTimeSlot || 'NIGHT',
            success: false,
            error: error.message
          }
        });
        
        skipped++;
      }
    }
    
    console.log(`📊 Risultato: ${bumped} bumped, ${skipped} skipped`);
    
  } catch (error) {
    console.error('❌ Errore fatale scheduler:', error);
  }
}

async function main() {
  console.log('🚀 BUMP Scheduler START');
  console.log(`⏱️ Intervallo: ${INTERVAL_MS / 1000}s`);
  console.log('🔄 Premi CTRL+C per fermare\n');
  
  // Primo check immediato
  await processBumps();
  
  // Poi ogni minuto
  setInterval(async () => {
    await processBumps();
  }, INTERVAL_MS);
}

main().catch(async (err) => {
  console.error('❌ Errore fatale:', err);
  await prisma.$disconnect();
  process.exit(1);
});

// Chiudi connessione su exit
process.on('SIGINT', async () => {
  console.log('\n\n👋 Arresto scheduler...');
  await prisma.$disconnect();
  process.exit(0);
});
