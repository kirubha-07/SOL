// SOL light bridge: OPTIONAL and UNTESTED against a real bulb.
// Runs on a computer on the same Wi-Fi as the bulb and exposes:
//   POST /dim      -> lower the bulb brightness (remembers the previous brightness)
//   POST /restore  -> put the brightness back
//   GET  /health   -> { ok: true }
// Credentials come from environment variables only. Nothing is stored on disk.
import http from 'node:http';
import { ApiClient } from 'tapo';

const {
  TAPO_EMAIL,
  TAPO_PASSWORD,
  BULB_IP,
  BULB_MODEL = 'l530',
  DIM_BRIGHTNESS = '15',
  PORT = '8787',
  HOST = '127.0.0.1',
  ALLOW_ORIGIN = 'http://localhost:5173',
} = process.env;

const MODELS = ['l510', 'l530', 'l535', 'l610', 'l630', 'l900', 'l920', 'l930'];
if (!TAPO_EMAIL || !TAPO_PASSWORD || !BULB_IP) {
  console.error('Set TAPO_EMAIL, TAPO_PASSWORD and BULB_IP (see bridge/README.md).');
  process.exit(1);
}
if (!MODELS.includes(BULB_MODEL.toLowerCase())) {
  console.error(`BULB_MODEL must be one of: ${MODELS.join(', ')}`);
  process.exit(1);
}
const dim = Math.min(100, Math.max(1, Number(DIM_BRIGHTNESS) || 15));
const origins = ALLOW_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);

const client = new ApiClient(TAPO_EMAIL, TAPO_PASSWORD);
let previous = null; // brightness before the last dim

// The `tapo` package has changed its light API between versions, so try both known shapes.
async function setBrightness(device, level) {
  if (typeof device.setBrightness === 'function') return device.setBrightness(level);
  if (typeof device.set === 'function') return device.set().brightness(level).send(device);
  throw new Error('Unsupported tapo package version: no setBrightness / set() on the device handle');
}

async function connect() {
  return client[BULB_MODEL.toLowerCase()](BULB_IP);
}

async function handleDim() {
  const device = await connect();
  const info = await device.getDeviceInfo();
  if (previous === null) previous = typeof info.brightness === 'number' ? info.brightness : 100;
  await setBrightness(device, dim);
}

async function handleRestore() {
  const device = await connect();
  await setBrightness(device, previous ?? 100);
  previous = null;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && origins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Needed when an https page calls a bridge on a private address (Chrome Private Network Access).
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(origin && origins.includes(origin) ? 204 : 403).end();
    return;
  }
  // Refuse browsers from origins that are not allowed (other websites must not be able to dim the light).
  if (origin && !origins.includes(origin)) {
    res.writeHead(403, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'origin not allowed' }));
    return;
  }
  const send = (code, body) => res.writeHead(code, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
  try {
    if (req.method === 'GET' && req.url === '/health') return send(200, { ok: true });
    if (req.method === 'POST' && req.url === '/dim') {
      await handleDim();
      return send(200, { ok: true, action: 'dim', brightness: dim });
    }
    if (req.method === 'POST' && req.url === '/restore') {
      await handleRestore();
      return send(200, { ok: true, action: 'restore' });
    }
    return send(404, { error: 'not found' });
  } catch (e) {
    console.error('Bulb error:', e instanceof Error ? e.message : e);
    return send(502, { error: 'could not control the bulb' });
  }
});

server.listen(Number(PORT), HOST, () => {
  console.log(`SOL light bridge listening on http://${HOST}:${PORT} (allowed origins: ${origins.join(', ')})`);
});
