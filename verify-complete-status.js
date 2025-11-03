const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 1;
  
  console.log('🔍 VERIFICA COMPLETA STATO PROFILO\n');
  
  // FOTO
  const photos = await prisma.photo.findMany({
    where: { userId },
    orderBy: { id: 'desc' }
  });
  
  const draft = photos.filter(p => p.status === 'DRAFT');
  const draftWithFace = draft.filter(p => p.isFace);
  
  console.log('📸 FOTO:');
  console.log(`   Totale: ${photos.length}`);
  console.log(`   DRAFT: ${draft.length}`);
  console.log(`   DRAFT con volto: ${draftWithFace.length}`);
  console.log('');
  
  // DOCUMENTI
  const documents = await prisma.document.findMany({
    where: { userId }
  });
  
  console.log('📄 DOCUMENTI:');
  console.log(`   Totale: ${documents.length}`);
  if (documents.length > 0) {
    documents.forEach((d, i) => {
      console.log(`   ${i+1}. ${d.type} - Status: ${d.status}`);
    });
  }
  console.log('');
  
  // CONSENSO
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { escortProfile: true }
  });
  
  const hasConsent = !!user?.escortProfile?.consentAcceptedAt;
  console.log('✅ CONSENSO LEGALE:');
  console.log(`   Accettato: ${hasConsent ? 'SÌ' : 'NO'}`);
  if (hasConsent) {
    console.log(`   Data: ${user.escortProfile.consentAcceptedAt}`);
  }
  console.log('');
  
  // RIEPILOGO FINALE
  console.log('📊 RIEPILOGO REQUISITI PER INVIO A VERIFICA:');
  console.log(`   ✓ Almeno 3 foto DRAFT: ${draft.length >= 3 ? '✅ OK' : '❌ MANCANO ' + (3 - draft.length)}`);
  console.log(`   ✓ Almeno 1 foto DRAFT con volto: ${draftWithFace.length >= 1 ? '✅ OK' : '❌ MANCA'}`);
  console.log(`   ✓ Almeno 1 documento: ${documents.length >= 1 ? '✅ OK' : '❌ MANCA'}`);
  console.log(`   ✓ Consenso accettato: ${hasConsent ? '✅ OK' : '❌ MANCA'}`);
  console.log('');
  
  const canSubmit = draft.length >= 3 && draftWithFace.length >= 1 && documents.length >= 1;
  
  if (canSubmit) {
    console.log('🎉 TUTTI I REQUISITI SODDISFATTI! Puoi inviare a verifica.');
  } else {
    console.log('⚠️  REQUISITI MANCANTI - non puoi inviare a verifica.');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
