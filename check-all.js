const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 VERIFICA COMPLETA STATO ESCORT\n');
  
  // 1. User e Profilo
  const user = await prisma.user.findUnique({
    where: { id: 1 },
    include: { 
      escortProfile: true,
      photos: true
    }
  });
  
  console.log('👤 UTENTE:');
  console.log(`   Nome: ${user.nome}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Ruolo: ${user.ruolo}`);
  console.log(`   Suspended: ${user.suspended}`);
  
  console.log('\n📋 PROFILO ESCORT:');
  if (user.escortProfile) {
    const profile = user.escortProfile;
    console.log(`   Tier: ${profile.tier}`);
    console.log(`   Consenso: ${profile.consentAcceptedAt ? 'SÌ' : 'NO'}`);
    console.log(`   Cities (tipo):`, typeof profile.cities);
    console.log(`   Cities (valore):`, JSON.stringify(profile.cities, null, 2));
  } else {
    console.log('   ❌ NESSUN PROFILO ESCORT');
  }
  
  console.log('\n📸 FOTO:');
  console.log(`   Totale: ${user.photos.length}`);
  user.photos.forEach(p => {
    console.log(`   - ID ${p.id}: status=${p.status}, isFace=${p.isFace}, url=${p.url ? 'SÌ' : 'NO'}`);
  });
  
  const bozze = user.photos.filter(p => p.status === 'DRAFT');
  const approved = user.photos.filter(p => p.status === 'APPROVED');
  const pending = user.photos.filter(p => p.status === 'PENDING');
  const inReview = user.photos.filter(p => p.status === 'IN_REVIEW');
  
  console.log(`\n   📊 Riepilogo:`);
  console.log(`      DRAFT: ${bozze.length}`);
  console.log(`      APPROVED: ${approved.length}`);
  console.log(`      PENDING: ${pending.length}`);
  console.log(`      IN_REVIEW: ${inReview.length}`);
  console.log(`      Con volto: ${user.photos.filter(p => p.isFace).length}`);
  
  console.log('\n\n💡 PROBLEMI RILEVATI:\n');
  
  const problemi = [];
  
  // Problema 1: Cities in formato oggetto
  if (user.escortProfile && user.escortProfile.cities) {
    const cities = user.escortProfile.cities;
    if (typeof cities === 'object' && !Array.isArray(cities)) {
      problemi.push('❌ CITIES in formato OGGETTO (vecchio) invece di ARRAY');
      problemi.push('   → L\'escort NON appare in /internazionale');
      problemi.push('   → Soluzione: convertire in array');
    }
  }
  
  // Problema 2: Foto con status sbagliato
  if (bozze.length > 0 && approved.length === 0) {
    problemi.push(`❌ ${bozze.length} foto in DRAFT invece di pronte per revisione`);
    problemi.push('   → Non può mandare a revisione');
    problemi.push('   → Soluzione: convertire DRAFT in stato corretto');
  }
  
  if (problemi.length === 0) {
    console.log('✅ NESSUN PROBLEMA - tutto ok!');
  } else {
    problemi.forEach(p => console.log(p));
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
