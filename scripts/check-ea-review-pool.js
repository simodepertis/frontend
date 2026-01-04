const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const eaWhere = {
    OR: [
      { sourceId: { startsWith: 'ea_' } },
      { sourceUrl: { contains: 'escort-advisor.com', mode: 'insensitive' } },
    ],
  };

  const [total, ea, eaRated, latest] = await Promise.all([
    prisma.importedReview.count(),
    prisma.importedReview.count({ where: eaWhere }),
    prisma.importedReview.count({
      where: {
        AND: [eaWhere, { reviewText: { not: null } }, { rating: { not: null } }],
      },
    }),
    prisma.importedReview.findMany({
      where: eaWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        reviewerName: true,
        rating: true,
        reviewDate: true,
        reviewText: true,
        sourceUrl: true,
        createdAt: true,
      },
    }),
  ]);

  console.log('Counts:', { total, ea, eaRated });
  console.log('Latest EA reviews (max 5):');
  for (const r of latest) {
    console.log({
      id: r.id,
      reviewerName: r.reviewerName,
      rating: r.rating,
      reviewDate: r.reviewDate,
      createdAt: r.createdAt,
      sourceUrl: r.sourceUrl,
      reviewText: String(r.reviewText || '').slice(0, 180),
    });
  }
}

main()
  .catch((e) => {
    console.error('DB check failed:', e?.message || e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
