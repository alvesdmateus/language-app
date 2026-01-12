import { getDivisionFromElo } from '../utils/division';
import prisma from '../utils/db';

async function testDivisions() {
  console.log('\n🧪 Testing division calculations...\n');

  // Test the specific ELO values mentioned
  const testElos = [994, 1000, 1006, 1200];

  console.log('Division calculation tests:');
  testElos.forEach(elo => {
    const divisionInfo = getDivisionFromElo(elo);
    console.log(`  ${elo} ELO → ${divisionInfo.displayName} (${divisionInfo.division}, tier ${divisionInfo.tier}, range: ${divisionInfo.minElo}-${divisionInfo.maxElo})`);
  });

  console.log('\n📊 Checking database...\n');

  // Get all language stats
  const stats = await prisma.languageStats.findMany({
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      eloRating: 'desc',
    },
  });

  console.log(`Found ${stats.length} language stat records:\n`);

  stats.forEach(stat => {
    const calculatedDivision = getDivisionFromElo(stat.eloRating);
    const mismatch = stat.division !== calculatedDivision.division;

    console.log(`${mismatch ? '❌' : '✅'} ${stat.user.username} - ${stat.language}:`);
    console.log(`   ELO: ${stat.eloRating}`);
    console.log(`   Stored: ${stat.division}`);
    console.log(`   Calculated: ${calculatedDivision.displayName} (${calculatedDivision.division})`);
    if (mismatch) {
      console.log(`   ⚠️  MISMATCH! Stored division doesn't match calculated!`);
    }
    console.log();
  });

  await prisma.$disconnect();
}

testDivisions().catch(console.error);
