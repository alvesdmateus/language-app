import prisma from '../utils/db';
import { getDivisionFromElo } from '../utils/division';

/**
 * Script to recalculate divisions for all users and language stats
 * Run this to fix any division inconsistencies
 */
async function recalculateDivisions() {
  console.log('🔄 Starting division recalculation...');

  try {
    // Recalculate divisions for all language stats
    const languageStats = await prisma.languageStats.findMany();
    console.log(`Found ${languageStats.length} language stat records`);

    let updated = 0;
    for (const stat of languageStats) {
      const divisionInfo = getDivisionFromElo(stat.eloRating);

      if (stat.division !== divisionInfo.division) {
        console.log(
          `Updating user ${stat.userId} ${stat.language}: ${stat.division} → ${divisionInfo.division} (ELO: ${stat.eloRating})`
        );

        await prisma.languageStats.update({
          where: { id: stat.id },
          data: { division: divisionInfo.division },
        });

        updated++;
      }
    }

    // Recalculate divisions for all users (based on their overall ELO)
    const users = await prisma.user.findMany();
    console.log(`\nFound ${users.length} users`);

    let usersUpdated = 0;
    for (const user of users) {
      const divisionInfo = getDivisionFromElo(user.eloRating);

      if (user.division !== divisionInfo.division) {
        console.log(
          `Updating user ${user.username}: ${user.division} → ${divisionInfo.division} (ELO: ${user.eloRating})`
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { division: divisionInfo.division },
        });

        usersUpdated++;
      }
    }

    console.log(`\n✅ Division recalculation complete!`);
    console.log(`   - Language stats updated: ${updated}/${languageStats.length}`);
    console.log(`   - Users updated: ${usersUpdated}/${users.length}`);
  } catch (error) {
    console.error('❌ Error recalculating divisions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
recalculateDivisions();
