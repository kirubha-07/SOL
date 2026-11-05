// Shared helpers for the Blynk proxy functions. The leading underscore keeps Vercel
// from exposing this file as an endpoint.

export const BLYNK_BASE = 'https://blynk.cloud/external/api';

/** Convert one raw Blynk value to a finite number, or null if missing/empty/not numeric. */
export function toNumber(raw) {
  if (Array.isArray(raw)) return toNumber(raw[0]);
  if (raw === null || raw === undefined || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Blynk's `get` endpoint answers differently depending on how many pins were asked for.
 * Accepts all the shapes seen in the wild and returns { v0: number|null, ... }:
 *   - object:   { "v0": "97", "v2": "72" }   (several pins)
 *   - array:    ["97"]                        (one pin)
 *   - scalar:   97 / "97"                     (one pin)
 */
export function parsePins(body, pins) {
  const out = {};
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const lower = {};
    for (const k of Object.keys(body)) lower[k.toLowerCase()] = body[k];
    for (const p of pins) out[p] = toNumber(lower[p]);
    return out;
  }
  for (const p of pins) out[p] = null;
  if (pins.length === 1) out[pins[0]] = toNumber(body);
  return out;
}

/** Parse a response body that may be JSON or plain text. */
export function parseBody(text) {
  const t = String(text ?? '').trim();
  if (t === '') return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

/** isHardwareConnected answers `true`/`false` (JSON or text). */
export function parseConnected(text) {
  const b = parseBody(text);
  if (typeof b === 'boolean') return b;
  if (typeof b === 'string') return b.trim().toLowerCase() === 'true';
  return false;
}

/** fetch with a timeout. Never logs or returns the URL (it contains the token). */
export async function timedFetch(url, init = {}, ms = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
