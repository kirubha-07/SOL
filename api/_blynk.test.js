import { describe, it, expect } from 'vitest';
import { parsePins, parseBody, parseConnected, toNumber } from './_blynk.js';

describe('blynk parsing', () => {
  it('parses an object response for several pins', () => {
    expect(parsePins({ v0: '97', v2: 72, v4: '0.12' }, ['v0', 'v2', 'v4'])).toEqual({ v0: 97, v2: 72, v4: 0.12 });
  });
  it('parses a plain value and an array for a single pin', () => {
    expect(parsePins('97', ['v0'])).toEqual({ v0: 97 });
    expect(parsePins(['97'], ['v0'])).toEqual({ v0: 97 });
    expect(parsePins(97, ['v0'])).toEqual({ v0: 97 });
  });
  it('returns null for missing, empty or non-numeric values', () => {
    expect(parsePins({ v0: '97' }, ['v0', 'v2'])).toEqual({ v0: 97, v2: null });
    expect(parsePins({ v0: '', v2: null, v4: 'abc' }, ['v0', 'v2', 'v4'])).toEqual({ v0: null, v2: null, v4: null });
    expect(parsePins('97', ['v0', 'v2'])).toEqual({ v0: null, v2: null });
  });
  it('keeps zero as zero (no finger)', () => {
    expect(toNumber('0')).toBe(0);
  });
  it('parses JSON or text bodies', () => {
    expect(parseBody('{"v0":"1"}')).toEqual({ v0: '1' });
    expect(parseBody('97')).toBe(97);
    expect(parseBody('')).toBeNull();
  });
  it('parses isHardwareConnected', () => {
    expect(parseConnected('true')).toBe(true);
    expect(parseConnected('false')).toBe(false);
    expect(parseConnected('')).toBe(false);
  });
});
