const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const photos = await prisma.photo.findMany({
    where: { userId: 1 }
  });
  
  console.log(`📸 Foto per escort ID 1: ${photos.length} totali\n`);
  
  photos.forEach(p => {
    console.log(`- ID ${p.id}: ${p.status} ${p.url ? '✅ ha URL' : '❌ no URL'}`);
  });
  
  const approved = photos.filter(p => p.status === 'APPROVED');
  console.log(`\n✅ Foto APPROVATE: ${approved.length}`);
  console.log(`⏳ Foto PENDING: ${photos.filter(p => p.status === 'PENDING').length}`);
  console.log(`❌ Foto RIFIUTATE: ${photos.filter(p => p.status === 'REJECTED').length}`);
  
  await prisma.$disconnect();
}

main();
