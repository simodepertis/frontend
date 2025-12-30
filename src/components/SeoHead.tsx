import Head from 'next/head';

type JsonLd = Record<string, any>;

export default function SeoHead({
  title,
  description,
  canonicalPath,
  jsonLd,
}: {
  title?: string;
  description?: string;
  canonicalPath: string;
  jsonLd?: JsonLd | JsonLd[];
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://incontriescort.org';
  const canonical = `${siteUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Head>
      <link rel="canonical" href={canonical} />
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {jsonLdArray.map((obj, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </Head>
  );
}
