// GET /api/vitals -> { spo2, hr, motion, connected, ts }
// Reads the band's latest values from Blynk. The token only ever lives in the
// BLYNK_TOKEN environment variable; it is never returned to the browser.
import { BLYNK_BASE, parseBody, parsePins, parseConnected, timedFetch } from './_blynk.js';

const PINS = ['v0', 'v2', 'v4']; // v0 = SpO2, v2 = heart rate, v4 = motion (g)

async function getPins(token, pins) {
  const qs = pins.join('&');
  const res = await timedFetch(`${BLYNK_BASE}/get?token=${encodeURIComponent(token)}&${qs}`);
  if (!res.ok) return null;
  return parsePins(parseBody(await res.text()), pins);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const token = process.env.BLYNK_TOKEN;
  if (!token) return res.status(502).json({ error: 'BLYNK_TOKEN is not configured on the server' });

  try {
    const connRes = await timedFetch(`${BLYNK_BASE}/isHardwareConnected?token=${encodeURIComponent(token)}`);
    if (!connRes.ok) return res.status(502).json({ error: `Blynk responded ${connRes.status}` });
    const connected = parseConnected(await connRes.text());

    // One call for all pins. If Blynk rejects it (e.g. a datastream that does not exist yet),
    // fall back to one call per pin so the pins that do exist still come through.
    let values = await getPins(token, PINS);
    if (!values) {
      values = {};
      for (const p of PINS) {
        const one = await getPins(token, [p]);
        values[p] = one ? one[p] : null;
      }
    }

    return res.status(200).json({
      spo2: values.v0,
      hr: values.v2,
      motion: values.v4,
      connected,
      ts: Date.now(), // server time of this read; Blynk does not return per-value timestamps here
    });
  } catch {
    return res.status(502).json({ error: 'Could not reach Blynk' });
  }
}
