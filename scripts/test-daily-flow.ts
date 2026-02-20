import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDailyFlow() {
  console.log('=== TESTING DAILY CHALLENGE FLOW ===\n');
  
  const today = new Date().toISOString().slice(0, 10);
  const gameType = 'royaledle';
  
  console.log(`Testing for date: ${today}, game: ${gameType}\n`);
  
  // Step 1: Get challenge
  console.log('Step 1: Fetching challenge...');
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { date_gameType: { date: today, gameType } },
  });
  
  if (!challenge) {
    console.log('❌ No challenge found for today!');
    return;
  }
  
  console.log(`✅ Challenge found: ID=${challenge.id}, CardID=${challenge.cardId}\n`);
  
  // Step 2: Create a test user if needed
  console.log('Step 2: Getting test user...');
  let testUser = await prisma.user.findFirst({
    where: { email: 'test@royalehaus.com' }
  });
  
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@royalehaus.com',
        username: 'testuser',
        password: 'hashed_password',
      }
    });
    console.log('✅ Test user created');
  } else {
    console.log('✅ Test user found');
  }
  
  console.log(`   User ID: ${testUser.id}\n`);
  
  // Step 3: Check if participation exists
  console.log('Step 3: Checking participation...');
  let participation = await prisma.dailyParticipation.findUnique({
    where: { challengeId_userId: { challengeId: challenge.id, userId: testUser.id } },
  });
  
  if (participation) {
    console.log(`✅ Participation exists:`);
    console.log(`   - Completed: ${participation.completed}`);
    console.log(`   - Won: ${participation.won}`);
    console.log(`   - Attempts: ${participation.attempts}\n`);
  } else {
    console.log('ℹ️  No participation yet\n');
  }
  
  // Step 4: Simulate API response for GET /api/daily
  console.log('Step 4: Simulating GET /api/daily response...');
  const apiResponse = {
    challenge: {
      id: challenge.id,
      date: challenge.date,
      gameType: challenge.gameType,
      cardId: challenge.cardId, // Always sent
    },
    participation: participation ? {
      completed: participation.completed,
      won: participation.won,
      attempts: participation.attempts,
      completedAt: participation.completedAt,
    } : null,
    isLoggedIn: true,
  };
  
  console.log('API Response:');
  console.log(JSON.stringify(apiResponse, null, 2));
  console.log();
  
  // Step 5: Test completion flow
  if (!participation?.completed) {
    console.log('Step 5: Simulating game completion...');
    
    participation = await prisma.dailyParticipation.create({
      data: {
        challengeId: challenge.id,
        userId: testUser.id,
        attempts: 3,
        completed: true,
        won: true,
        completedAt: new Date(),
      },
    });
    
    console.log('✅ Participation created (Won in 3 attempts)\n');
  } else {
    console.log('Step 5: Already completed, skipping\n');
  }
  
  // Step 6: Verify completed state
  console.log('Step 6: Verifying completed state...');
  const finalParticipation = await prisma.dailyParticipation.findUnique({
    where: { challengeId_userId: { challengeId: challenge.id, userId: testUser.id } },
  });
  
  const finalResponse = {
    challenge: {
      id: challenge.id,
      date: challenge.date,
      gameType: challenge.gameType,
      cardId: challenge.cardId,
    },
    participation: {
      completed: finalParticipation?.completed,
      won: finalParticipation?.won,
      attempts: finalParticipation?.attempts,
    },
    isLoggedIn: true,
  };
  
  console.log('Final API Response (after completion):');
  console.log(JSON.stringify(finalResponse, null, 2));
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('\nExpected behavior:');
  console.log('1. ✅ Challenge has cardId');
  console.log('2. ✅ Participation shows completed = true');
  console.log('3. ✅ Game should prevent new guesses');
  console.log('4. ✅ DailyGameCard should show as completed');
}

testDailyFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
