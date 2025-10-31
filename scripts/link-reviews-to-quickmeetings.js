const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script per collegare le recensioni di Escort Advisor agli annunci Incontri Veloci
 * Matching basato su: telefono, nome escort
 */

function normalizePhone(phone) {
  if (!phone) return null;
  // Rimuovi spazi, trattini, parentesi, +39, 0039
  return phone
    .replace(/[\s\-\(\)]/g, '')
    .replace(/^(\+39|0039)/, '')
    .replace(/^0+/, '');
}

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function calculateSimilarity(str1, str2) {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  
  if (s1 === s2) return 1.0;
  
  // Controllo se uno contiene l'altro
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Levenshtein distance semplificato
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function linkReviewsToQuickMeetings() {
  console.log('🔗 Inizio collegamento recensioni a Incontri Veloci...\n');

  try {
    // 1. Carica tutte le recensioni non ancora collegate
    const reviews = await prisma.importedReview.findMany({
      where: {
        quickMeetingId: null
      }
    });

    console.log(`📊 Trovate ${reviews.length} recensioni da collegare\n`);

    // 2. Carica tutti gli annunci Incontri Veloci
    const quickMeetings = await prisma.quickMeeting.findMany({
      where: {
        isActive: true
      }
    });

    console.log(`📊 Trovati ${quickMeetings.length} annunci Incontri Veloci attivi\n`);

    let linked = 0;
    let skipped = 0;

    // 3. Per ogni recensione, cerca match
    for (const review of reviews) {
      const reviewPhone = normalizePhone(review.escortPhone);
      const reviewName = normalizeName(review.escortName);

      let bestMatch = null;
      let bestScore = 0;

      for (const meeting of quickMeetings) {
        let score = 0;

        // Match per telefono (priorità massima)
        if (reviewPhone && meeting.phone) {
          const meetingPhone = normalizePhone(meeting.phone);
          if (reviewPhone === meetingPhone) {
            score += 100; // Match perfetto telefono
          }
        }

        if (reviewPhone && meeting.whatsapp) {
          const meetingWhatsapp = normalizePhone(meeting.whatsapp);
          if (reviewPhone === meetingWhatsapp) {
            score += 100; // Match perfetto whatsapp
          }
        }

        // Match per nome (secondaria)
        if (reviewName && meeting.title) {
          const nameSimilarity = calculateSimilarity(reviewName, meeting.title);
          if (nameSimilarity > 0.7) {
            score += nameSimilarity * 50; // Max 50 punti per nome
          }
        }

        // Aggiorna best match
        if (score > bestScore) {
          bestScore = score;
          bestMatch = meeting;
        }
      }

      // 4. Se trovato match con score sufficiente, collega
      if (bestMatch && bestScore >= 80) {
        await prisma.importedReview.update({
          where: { id: review.id },
          data: { quickMeetingId: bestMatch.id }
        });

        console.log(`✅ Collegata recensione "${review.escortName}" → "${bestMatch.title}" (score: ${bestScore.toFixed(1)})`);
        linked++;
      } else {
        console.log(`⏭️  Recensione "${review.escortName}" - nessun match trovato (best score: ${bestScore.toFixed(1)})`);
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Collegamento completato!`);
    console.log(`   • Recensioni collegate: ${linked}`);
    console.log(`   • Recensioni saltate: ${skipped}`);
    console.log('='.repeat(60));

    // 5. Mostra statistiche finali
    const stats = await prisma.quickMeeting.findMany({
      where: {
        isActive: true,
        importedReviews: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { importedReviews: true }
        }
      },
      orderBy: {
        importedReviews: {
          _count: 'desc'
        }
      },
      take: 10
    });

    if (stats.length > 0) {
      console.log('\n📊 Top 10 annunci con più recensioni:');
      stats.forEach((meeting, i) => {
        console.log(`   ${i + 1}. "${meeting.title}" - ${meeting._count.importedReviews} recensioni`);
      });
    }

  } catch (error) {
    console.error('❌ Errore durante il collegamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
linkReviewsToQuickMeetings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
