const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('🔧 Iniziando correzione ruoli utenti...');
    
    // Trova tutti gli utenti con ruolo 'admin' che non dovrebbero esserlo
    const adminUsers = await prisma.user.findMany({
      where: { ruolo: 'admin' },
      select: { id: true, email: true, nome: true, ruolo: true }
    });
    
    console.log(`📋 Trovati ${adminUsers.length} utenti con ruolo admin:`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.nome}) - ID: ${user.id}`);
    });
    
    if (adminUsers.length === 0) {
      console.log('✅ Nessun utente admin da correggere');
      return;
    }
    
    // Mantieni solo il primo utente come admin, gli altri diventa 'user'
    const firstAdmin = adminUsers[0];
    const usersToFix = adminUsers.slice(1);
    
    console.log(`👑 Mantengo ${firstAdmin.email} come admin`);
    console.log(`🔄 Cambio ${usersToFix.length} utenti da admin a user:`);
    
    for (const user of usersToFix) {
      await prisma.user.update({
        where: { id: user.id },
        data: { ruolo: 'user' }
      });
      console.log(`  ✅ ${user.email} -> ruolo cambiato a 'user'`);
    }
    
    console.log('🎉 Correzione completata!');
    
    // Mostra il riepilogo finale
    const finalUsers = await prisma.user.findMany({
      select: { email: true, ruolo: true }
    });
    
    console.log('\n📊 Riepilogo finale ruoli:');
    const roleCount = {};
    finalUsers.forEach(user => {
      roleCount[user.ruolo] = (roleCount[user.ruolo] || 0) + 1;
    });
    
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} utenti`);
    });
    
  } catch (error) {
    console.error('❌ Errore durante la correzione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
