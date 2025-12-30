const { PrismaClient } = require("@prisma/client");

(async () => {
  const p = new PrismaClient();
  try {
    const m = await p.quickMeeting.findFirst({
      where: { category: "CENTRO_MASSAGGI" },
      orderBy: { updatedAt: "desc" },
      select: { id:true, city:true, phone:true, whatsapp:true, photos:true, sourceUrl:true, updatedAt:true }
    });
    console.log(m);
  } finally {
    await p.$disconnect();
  }
})();
