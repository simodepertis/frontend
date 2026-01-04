const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DELETE = String(process.env.DELETE || '') === '1';

const patterns = [
  'voti utili',
  'contributore livello',
  'recensioni degli utenti',
  'ti è stata utile',
  'espandi',
];

function buildWhere() {
  return {
    AND: [
      {
        OR: [
          { sourceId: { startsWith: 'ea_' } },
          { sourceUrl: { contains: 'escort-advisor.com', mode: 'insensitive' } },
        ],
      },
      {
        OR: patterns.map((p) => ({
          reviewText: {
            contains: p,
            mode: 'insensitive',
          },
        })),
      },
    ],
  };
}

async function main() {
  const where = buildWhere();

  const count = await prisma.importedReview.count({ where });
  console.log(`EA dirty reviews matched: ${count}`);
  console.log(`Mode: ${DELETE ? 'DELETE' : 'DRY_RUN (no changes)'}`);

  if (!DELETE || count === 0) return;

  const result = await prisma.importedReview.deleteMany({ where });
  console.log(`Deleted: ${result.count}`);
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e?.message || e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
