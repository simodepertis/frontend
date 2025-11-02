const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const photo = await prisma.photo.update({
    where: { id: 1 },
    data: { status: 'APPROVED' }
  });
  
  console.log('✅ Foto ID 1 APPROVATA');
  console.log('Status:', photo.status);
  
  await prisma.$disconnect();
}

main();
