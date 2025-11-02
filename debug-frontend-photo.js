const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 DEBUG PROBLEMA FOTO FRONTEND\n');
  
  const photos = await prisma.photo.findMany({
    where: { userId: 1 }
  });
  
  console.log(`📸 Foto nel database: ${photos.length}\n`);
  
  photos.forEach(p => {
    console.log(`Foto ID ${p.id}:`);
    console.log(`  status database: "${p.status}"`);
    console.log(`  status frontend: "${p.status === 'APPROVED' ? 'approvata' : p.status === 'REJECTED' ? 'rifiutata' : p.status === 'IN_REVIEW' ? 'in_review' : 'bozza'}"`);
    console.log(`  isFace: ${p.isFace}`);
    console.log(`  url: ${p.url ? 'presente' : 'mancante'}`);
    console.log('');
  });
  
  console.log('💡 ANALISI:\n');
  
  const draft = photos.filter(p => p.status === 'DRAFT');
  const approved = photos.filter(p => p.status === 'APPROVED');
  const inReview = photos.filter(p => p.status === 'IN_REVIEW');
  
  console.log(`DRAFT (bozza): ${draft.length}`);
  console.log(`APPROVED (approvata): ${approved.length}`);
  console.log(`IN_REVIEW (in revisione): ${inReview.length}`);
  
  console.log('\n⚠️ PROBLEMA:');
  if (approved.length > 0 && draft.length === 0) {
    console.log('Le foto sono APPROVED, non DRAFT!');
    console.log('→ Il frontend conta solo le foto in stato "bozza" (DRAFT)');
    console.log('→ Foto APPROVED non vengono contate per il limite di 3 foto');
    console.log('');
    console.log('SOLUZIONE: Quando carichi nuove foto, devono essere in DRAFT');
    console.log('          Le APPROVED sono foto già pubblicate/verificate');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
