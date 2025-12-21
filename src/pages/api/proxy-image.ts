import type { NextApiRequest, NextApiResponse } from 'next'

// Semplice proxy immagini per domini remoti specifici (es. bakecaincontrii)
// Evita hotlink/block lato browser facendo la richiesta dal server

const ALLOWED_HOSTS = [
  'www.bakecaincontrii.com',
  'bakecaincontrii.com',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = typeof req.query.url === 'string' ? req.query.url : null;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  const host = target.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h));
  if (!allowed) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    const upstream = await fetch(target.toString(), {
      // Possiamo impostare un user-agent realistico se serve
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': target.origin,
      },
    });

    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status).json({ error: 'Upstream error' });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Proxy image error:', err);
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}
