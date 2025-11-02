const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📸 FOTO NEL DATABASE ORA:\n');
  
  const photos = await prisma.photo.findMany({
    where: { userId: 1 },
    orderBy: { id: 'asc' }
  });
  
  console.log(`Totale foto: ${photos.length}\n`);
  
  photos.forEach((p, i) => {
    console.log(`${i+1}. ID ${p.id}:`);
    console.log(`   Status: ${p.status}`);
    console.log(`   IsFace: ${p.isFace}`);
    console.log(`   URL: ${p.url ? 'presente' : 'MANCANTE'}`);
    console.log(`   CreatedAt: ${p.createdAt}`);
    console.log('');
  });
  
  const draft = photos.filter(p => p.status === 'DRAFT');
  const approved = photos.filter(p => p.status === 'APPROVED');
  const pending = photos.filter(p => p.status === 'PENDING');
  const inReview = photos.filter(p => p.status === 'IN_REVIEW');
  
  console.log('📊 RIEPILOGO:');
  console.log(`   DRAFT (bozza - contano per "Invia a verifica"): ${draft.length}`);
  console.log(`   APPROVED (già pubblicate): ${approved.length}`);
  console.log(`   PENDING: ${pending.length}`);
  console.log(`   IN_REVIEW: ${inReview.length}`);
  console.log('');
  console.log(`   Con volto: ${photos.filter(p => p.isFace).length}`);
  console.log('');
  
  if (draft.length >= 3) {
    const withFace = draft.filter(p => p.isFace).length;
    console.log('✅ PUOI INVIARE A VERIFICA!');
    console.log(`   Foto DRAFT: ${draft.length}/3 ✓`);
    console.log(`   Con volto: ${withFace}/1 ${withFace >= 1 ? '✓' : '✗'}`);
  } else {
    console.log('❌ NON PUOI INVIARE A VERIFICA');
    console.log(`   Foto DRAFT: ${draft.length}/3 (ne mancano ${3-draft.length})`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
