const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script per collegare le recensioni di Escort Advisor agli annunci Incontri Veloci
 * Matching basato su: telefono, nome escort
 */

function normalizePhone(phone) {
  if (!phone) return null;

  // Estrai solo cifre (gestisce anche whatsapp URL tipo https://wa.me/39333...)
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;

  // Normalizza prefisso Italia
  if (digits.startsWith('0039')) digits = digits.slice(4);
  if (digits.startsWith('39') && digits.length > 10) digits = digits.slice(2);

  // Se rimane più lungo, usa le ultime 10 cifre (tipico numero IT)
  if (digits.length > 10) digits = digits.slice(-10);

  // Rimuovi zeri iniziali residui
  digits = digits.replace(/^0+/, '');

  return digits || null;
}

function phoneSuffixMatch(a, b, min = 8) {
  const da = normalizePhone(a);
  const db = normalizePhone(b);
  if (!da || !db) return false;
  const la = da.length;
  const lb = db.length;
  const n = Math.min(la, lb);
  if (n < min) return false;
  return da.slice(-n) === db.slice(-n);
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

  const MATCH_MODE = String(process.env.MATCH_MODE || '').toLowerCase();
  const NAME_MIN_SIMILARITY = Number(process.env.NAME_MIN_SIMILARITY || '0.85');
  const MIN_SCORE = Number(process.env.MIN_SCORE || (MATCH_MODE === 'name' ? '40' : '80'));
  if (MATCH_MODE === 'name') {
    console.log(`⚠️ MATCH_MODE=name attivo: collega recensioni anche senza telefono (solo nome).`);
    console.log(`   NAME_MIN_SIMILARITY=${NAME_MIN_SIMILARITY} MIN_SCORE=${MIN_SCORE}\n`);
  }

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

        // Match per telefono (priorità massima) - sempre attivo
        if (reviewPhone && meeting.phone) {
          const meetingPhone = normalizePhone(meeting.phone);
          if (reviewPhone === meetingPhone || phoneSuffixMatch(reviewPhone, meetingPhone)) {
            score += 100; // Match perfetto telefono
          }
        }

        if (reviewPhone && meeting.whatsapp) {
          const meetingWhatsapp = normalizePhone(meeting.whatsapp);
          if (reviewPhone === meetingWhatsapp || phoneSuffixMatch(reviewPhone, meetingWhatsapp)) {
            score += 100; // Match perfetto whatsapp
          }
        }

        // Match per nome (secondaria / o primaria in MATCH_MODE=name)
        if (reviewName && meeting.title) {
          const nameSimilarity = calculateSimilarity(reviewName, meeting.title);

          // modalità default: contribuisce solo come boost
          if (MATCH_MODE !== 'name') {
            if (nameSimilarity > 0.7) {
              score += nameSimilarity * 50; // Max 50 punti per nome
            }
          } else {
            // modalità name-only: usa nome come metrica principale
            // 0..1 => 0..100
            if (nameSimilarity >= NAME_MIN_SIMILARITY) {
              score += nameSimilarity * 100;
            }
          }
        }

        // Aggiorna best match
        if (score > bestScore) {
          bestScore = score;
          bestMatch = meeting;
        }
      }

      // 4. Se trovato match con score sufficiente, collega
      if (bestMatch && bestScore >= MIN_SCORE) {
        await prisma.importedReview.update({
          where: { id: review.id },
          data: { quickMeetingId: bestMatch.id }
        });

        const path = `/incontri-veloci/${bestMatch.id}`;
        console.log(`✅ Collegata recensione "${review.escortName}" → "${bestMatch.title}" (id: ${bestMatch.id}, score: ${bestScore.toFixed(1)})`);
        console.log(`   🔎 Apri sul sito: ${path}`);
        linked++;
      } else {
        if (bestMatch && bestScore > 0) {
          console.log(`⏭️  Recensione "${review.escortName}" - nessun match (best: "${bestMatch.title}" id ${bestMatch.id}, score: ${bestScore.toFixed(1)})`);
        } else {
          console.log(`⏭️  Recensione "${review.escortName}" - nessun match trovato (best score: ${bestScore.toFixed(1)})`);
        }
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
    const msg = String(error && error.message ? error.message : error || '');
    if (msg.includes("Can't reach database server")) {
      console.error('ℹ️ Prisma non riesce a raggiungere il DB. Controlla:');
      console.error('   - variabile DATABASE_URL nel tuo ambiente/.env');
      console.error('   - rete/firewall/VPN che blocca la porta 5432');
      console.error('   - Neon/DB online');
      console.error('   In alternativa esegui questi script direttamente su Hetzner/server dove il DB è raggiungibile.');
    }
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
