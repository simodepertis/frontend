import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const revalidate = 60 * 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://incontriescort.org';
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/escort`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/incontri-veloci`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/cerca`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/top10`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/nuove-escort`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/trans`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/uomini`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/termini`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/cookie`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/contatti`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  try {
    const [users, meetings] = await Promise.all([
      prisma.user.findMany({
        where: {
          ruolo: { in: ['escort', 'agency'] as any },
          suspended: false,
          escortProfile: { isNot: null },
        },
        select: {
          slug: true,
          createdAt: true,
          escortProfile: { select: { updatedAt: true } },
        },
        take: 50000,
      }),
      prisma.quickMeeting.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: now },
        },
        select: {
          id: true,
          updatedAt: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 50000,
      }),
    ]);

    const escortEntries: MetadataRoute.Sitemap = users
      .map((u) => {
        const slug = (u.slug && String(u.slug).trim().length > 0) ? String(u.slug) : null;
        if (!slug) return null;
        const lastModified = (u.escortProfile?.updatedAt || u.createdAt || now) as Date;
        return {
          url: `${siteUrl}/escort/${encodeURIComponent(slug)}`,
          lastModified,
          changeFrequency: 'daily',
          priority: 0.8,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;

    const meetingEntries: MetadataRoute.Sitemap = meetings.map((m) => ({
      url: `${siteUrl}/incontri-veloci/${m.id}`,
      lastModified: (m.updatedAt || m.publishedAt || now) as Date,
      changeFrequency: 'daily',
      priority: 0.6,
    }));

    return [...staticEntries, ...escortEntries, ...meetingEntries];
  } catch {
    return staticEntries;
  }
}
