import { prisma } from '../src/shared/prisma';

async function fixGameLogos() {
  console.log('Fixing game logos...');
  const games = await prisma.game.findMany();
  let fixed = 0;

  for (const game of games) {
    if (game.logo) {
      // Check if logo already has http and has double URL, or extract just /uploads/... part
      let fixedLogo = game.logo;
      
      // Check if it starts with http/https and extract /uploads... if present
      if (fixedLogo.startsWith('http://') || fixedLogo.startsWith('https://')) {
        const pathMatch = fixedLogo.match(/\/uploads\/.*$/);
        if (pathMatch) {
          fixedLogo = pathMatch[0];
        }
      }

      // Also check if it has duplicate URLs like http://...http://... and clean up
      if (fixedLogo.includes('http://http://') || fixedLogo.includes('https://https://') || fixedLogo.includes('http://https://')) {
        const pathMatch = fixedLogo.match(/\/uploads\/.*$/);
        if (pathMatch) {
          fixedLogo = pathMatch[0];
        }
      }

      if (fixedLogo !== game.logo) {
        await prisma.game.update({
          where: { id: game.id },
          data: { logo: fixedLogo }
        });
        console.log(`Fixed game: ${game.name}`);
        fixed++;
      }
    }
  }

  console.log(`Done! Fixed ${fixed} game logos.`);
  await prisma.$disconnect();
}

fixGameLogos().catch(err => {
  console.error(err);
  process.exit(1);
});
