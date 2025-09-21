import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || '7d') as '7d' | '30d' | '90d';
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [views, clicks, saves, bookings] = await Promise.all([
      prisma.profileEvent.count({ where: { userId: payload.userId, type: 'VIEW', createdAt: { gte: since } } }),
      prisma.profileEvent.count({ where: { userId: payload.userId, type: 'CONTACT_CLICK', createdAt: { gte: since } } }),
      prisma.profileEvent.count({ where: { userId: payload.userId, type: 'SAVE', createdAt: { gte: since } } }),
      prisma.profileEvent.count({ where: { userId: payload.userId, type: 'BOOKING_CONFIRMED', createdAt: { gte: since } } }),
    ]);

    // Simple trend: bucket per day
    const buckets: Record<string, number> = {};
    const events = await prisma.profileEvent.findMany({ where: { userId: payload.userId, createdAt: { gte: since } }, select: { createdAt: true } });
    events.forEach((e: { createdAt: Date }) => {
      const key = e.createdAt.toISOString().slice(0, 10);
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const trend = Object.entries(buckets).sort((a,b) => a[0] < b[0] ? -1 : 1).map(([date, count], idx) => ({ x: idx + 1, y: count }));

    return NextResponse.json({
      views,
      contactClicks: clicks,
      saves,
      bookings,
      ctr: views ? Math.round((clicks / views) * 1000) / 10 : 0,
      conv: views ? Math.round((bookings / views) * 1000) / 10 : 0,
      trend,
      topCities: [ { name: 'Milano', value: 38 }, { name: 'Roma', value: 26 }, { name: 'Torino', value: 14 }, { name: 'Bologna', value: 9 } ],
      topServices: [ { name: 'Massaggio', value: 31 }, { name: 'Accompagnamento', value: 22 }, { name: 'GFE', value: 18 }, { name: 'Servizi VIP', value: 10 } ],
      referrers: [ { name: 'Google', value: 42 }, { name: 'Telegram', value: 18 }, { name: 'Direct', value: 25 }, { name: 'Social', value: 15 } ],
    });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
