// Script to find users by name pattern
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Searching for users...\n');
  
  // Search for ALVARO and ADRIAN (case insensitive)
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: 'alvaro', mode: 'insensitive' } },
        { username: { contains: 'adrian', mode: 'insensitive' } },
        { email: { contains: 'alvaro', mode: 'insensitive' } },
        { email: { contains: 'adrian', mode: 'insensitive' } },
      ]
    },
    select: { 
      id: true, 
      email: true, 
      username: true, 
      role: true,
      createdAt: true,
      avatarId: true,
      royaleAvatarId: true,
    }
  });
  
  if (users.length === 0) {
    console.log('❌ No users found matching "alvaro" or "adrian"');
    console.log('\n💡 These users need to register first in RoyaleHaus');
  } else {
    console.log(`Found ${users.length} user(s):\n`);
    for (const u of users) {
      console.log(`  👤 ${u.username}`);
      console.log(`     Email: ${u.email}`);
      console.log(`     Role: ${u.role || 'user'}`);
      console.log(`     OnePiece Avatar: ${u.avatarId || 'none'}`);
      console.log(`     Royale Avatar: ${u.royaleAvatarId || 'none'}`);
      console.log(`     Created: ${u.createdAt.toISOString().slice(0,10)}`);
      console.log('');
    }
  }
  
  // List all users for reference
  console.log('\n📋 All users in database:');
  const allUsers = await prisma.user.findMany({
    select: { username: true, email: true, role: true },
    orderBy: { username: 'asc' }
  });
  for (const u of allUsers) {
    const icon = u.role === 'admin' ? '👑' : '👤';
    console.log(`  ${icon} ${u.username} (${u.email}) - ${u.role || 'user'}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
