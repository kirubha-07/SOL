// POST /api/command  body: { pin: 'v3' | 'v5', value: 0 | 1 }
//   v3 = start/stop sending (1 = start). v5 = vibrate the band (1 = vibrate for 2 s).
// Only whitelisted pin/value pairs are accepted; the token never leaves the server.
import { BLYNK_BASE, timedFetch } from './_blynk.js';

const ALLOWED = { v3: [0, 1], v5: [1] };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const token = process.env.BLYNK_TOKEN;
  if (!token) return res.status(502).json({ error: 'BLYNK_TOKEN is not configured on the server' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  const pin = body && typeof body.pin === 'string' ? body.pin.toLowerCase() : '';
  const value = body ? body.value : undefined;
  if (!Object.hasOwn(ALLOWED, pin) || !ALLOWED[pin].includes(value)) {
    return res.status(400).json({ error: 'Invalid command. Allowed: v3 in {0,1}, v5 = 1' });
  }

  try {
    const r = await timedFetch(`${BLYNK_BASE}/update?token=${encodeURIComponent(token)}&${pin}=${value}`);
    if (!r.ok) return res.status(502).json({ error: `Blynk responded ${r.status}` });
    return res.status(200).json({ ok: true, pin, value });
  } catch {
    return res.status(502).json({ error: 'Could not reach Blynk' });
  }
}
