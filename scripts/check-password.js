const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkPassword() {
  try {
    console.log('🔍 Controllo password admin...');
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@incontriesescort.org' },
      select: { id: true, nome: true, email: true, password: true, ruolo: true }
    });
    
    if (!admin) {
      console.log('❌ Admin non trovato');
      return;
    }
    
    console.log('✅ Admin trovato:', admin.email);
    console.log('🔑 Password hash:', admin.password ? 'Presente' : 'Mancante');
    
    // Test password
    const testPassword = 'Admin123!';
    
    if (admin.password) {
      const isValid = await bcrypt.compare(testPassword, admin.password);
      console.log(`🧪 Test password "${testPassword}":`, isValid ? '✅ VALIDA' : '❌ NON VALIDA');
    } else {
      console.log('⚠️ Password non hashata nel database');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();
