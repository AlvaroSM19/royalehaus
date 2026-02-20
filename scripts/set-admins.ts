// Script to manage admin users
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 RoyaleHaus Admin Manager');
  console.log('='.repeat(50));
  
  // Mostrar la URL de la base de datos (ocultar contraseña)
  const dbUrl = process.env.DATABASE_URL || 'NO CONFIGURADA';
  const safeUrl = dbUrl.replace(/:([^@]+)@/, ':***@');
  console.log(`🔗 Database: ${safeUrl}\n`);

  // Listar TODOS los usuarios
  console.log('👥 Todos los usuarios en la BD:');
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, username: true, role: true, createdAt: true },
    orderBy: { username: 'asc' },
  });
  
  if (allUsers.length === 0) {
    console.log('   ⚠️  No hay usuarios registrados');
  } else {
    for (const u of allUsers) {
      const roleIcon = u.role === 'admin' ? '👑' : '👤';
      console.log(`   ${roleIcon} ${u.username} (${u.email}) - role: ${u.role || 'user'} - ${u.createdAt.toISOString().slice(0,10)}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Verificar sesiones activas
  console.log('🔐 Sesiones activas:');
  const sessions = await prisma.session.findMany({
    include: { user: { select: { username: true, role: true } } },
    where: { expiresAt: { gt: new Date() } }
  });
  
  if (sessions.length === 0) {
    console.log('   ⚠️  No hay sesiones activas');
  } else {
    for (const s of sessions) {
      console.log(`   🎫 ${s.user.username} (role: ${s.user.role || 'user'}) - expira: ${s.expiresAt.toISOString().slice(0,10)}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Si se pasa argumento --set-admin username
  const args = process.argv.slice(2);
  if (args[0] === '--set-admin' && args[1]) {
    const targetUsername = args[1];
    console.log(`\n🔧 Intentando dar rol admin a: ${targetUsername}`);
    
    const user = await prisma.user.findFirst({
      where: { username: { equals: targetUsername, mode: 'insensitive' } }
    });
    
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' }
      });
      console.log(`✅ ${user.username} ahora es admin`);
    } else {
      console.log(`❌ Usuario "${targetUsername}" no encontrado`);
      console.log(`   💡 Sugerencia: El usuario debe registrarse primero en RoyaleHaus`);
    }
  } else if (args.length === 0) {
    console.log('\n💡 Uso: npx tsx scripts/set-admins.ts --set-admin <username>');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
