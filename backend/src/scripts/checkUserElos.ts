import prisma from '../utils/db';

async function checkUserElos() {
  console.log('\n📊 User ELO Ratings:\n');

  const users = await prisma.user.findMany({
    select: {
      username: true,
      eloRating: true,
      division: true,
    },
  });

  users.forEach(user => {
    console.log(`  ${user.username}: ${user.eloRating} ELO, ${user.division}`);
  });

  console.log('\n📊 Language Stats ELO Ratings:\n');

  const stats = await prisma.languageStats.findMany({
    include: {
      user: {
        select: { username: true },
      },
    },
    orderBy: [
      { userId: 'asc' },
      { eloRating: 'desc' },
    ],
  });

  let currentUser = '';
  stats.forEach(stat => {
    if (stat.user.username !== currentUser) {
      currentUser = stat.user.username;
      console.log(`\n  ${currentUser}:`);
    }
    console.log(`    ${stat.language}: ${stat.eloRating} ELO (${stat.division})`);
  });

  await prisma.$disconnect();
}

checkUserElos().catch(console.error);
