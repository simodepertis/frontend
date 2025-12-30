const { PrismaClient } = require("@prisma/client");

(async () => {
  const p = new PrismaClient();
  try {
    const r = await p.$queryRawUnsafe("SELECT 1");
    console.log("DB OK", r);
  } catch (e) {
    console.error("DB FAIL", e.message);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();
