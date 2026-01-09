const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const INTERVAL_MS = 60 * 1000;
const BATCH_SIZE = 50;

async function processDueSchedules() {
  const now = new Date();

  const due = await prisma.quickMeetingBumpSchedule.findMany({
    where: {
      status: 'PENDING',
      runAt: { lte: now },
      purchase: {
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    },
    orderBy: { runAt: 'asc' },
    take: BATCH_SIZE,
    include: { purchase: true },
  });

  if (due.length === 0) return { processed: 0, skipped: 0 };

  let processed = 0;
  let skipped = 0;

  for (const sched of due) {
    try {
      await prisma.$transaction(async (tx) => {
        const current = await tx.quickMeetingBumpSchedule.findUnique({
          where: { id: sched.id },
          include: { purchase: true },
        });

        if (!current) {
          skipped++;
          return;
        }

        if (current.status !== 'PENDING') {
          skipped++;
          return;
        }

        const now2 = new Date();

        if (current.runAt > now2) {
          skipped++;
          return;
        }

        if (!current.purchase || current.purchase.status !== 'ACTIVE' || current.purchase.expiresAt <= now2) {
          await tx.quickMeetingBumpSchedule.update({
            where: { id: current.id },
            data: { status: 'SKIPPED', executedAt: now2 },
          });
          skipped++;
          return;
        }

        await tx.quickMeeting.update({
          where: { id: current.purchase.meetingId },
          data: { publishedAt: now2, lastBumpAt: now2, bumpCount: { increment: 1 } },
        });

        await tx.bumpLog.create({
          data: {
            quickMeetingId: current.purchase.meetingId,
            bumpedAt: now2,
            timeSlot: current.window || 'DAY',
            success: true,
          },
        });

        await tx.quickMeetingBumpSchedule.update({
          where: { id: current.id },
          data: { status: 'DONE', executedAt: now2 },
        });
      });

      processed++;
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      console.error(`[qm-bump-worker] schedule #${sched.id} error:`, msg);
      skipped++;

      try {
        await prisma.bumpLog.create({
          data: {
            quickMeetingId: sched.purchase.meetingId,
            bumpedAt: new Date(),
            timeSlot: sched.window || 'DAY',
            success: false,
            error: msg,
          },
        });
      } catch {
        // ignore log failure
      }
    }
  }

  return { processed, skipped };
}

async function tick() {
  const now = new Date();
  try {
    const { processed, skipped } = await processDueSchedules();
    if (processed || skipped) {
      console.log(`[qm-bump-worker] ${now.toISOString()} processed=${processed} skipped=${skipped}`);
    }
  } catch (e) {
    console.error('[qm-bump-worker] fatal tick error', e);
  }
}

async function main() {
  console.log('[qm-bump-worker] START');
  await tick();
  setInterval(() => {
    tick();
  }, INTERVAL_MS);
}

main().catch(async (e) => {
  console.error('[qm-bump-worker] fatal error', e);
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});
