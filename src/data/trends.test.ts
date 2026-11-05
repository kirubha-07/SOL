import { describe, it, expect } from 'vitest';
import { bucketWindows, countEntries } from './trends';
import type { ProcessedWindow } from './stateEngine';

const w = (i: number, hr: number | null, label: ProcessedWindow['label'], reported: ProcessedWindow['reported']): ProcessedWindow => ({
    idx: i, start: i * 30000, end: (i + 1) * 30000, meanHr: hr, meanMotion: 0.1, nHr: 7, label, reported,
});

describe('trends', () => {
    const ws = [w(0, 70, 'Calm', 'Calm'), w(1, 95, 'Escalating', 'Calm'), w(2, 95, 'Escalating', 'Escalating'), w(3, 95, 'Escalating', 'Escalating'), w(4, 70, 'Calm', 'Escalating')];
    it('counts entries into a state once per episode', () => {
        expect(countEntries(ws, 'Escalating')).toEqual([60000]);
    });
    it('buckets means and minutes per state', () => {
        const [b] = bucketWindows(ws, 150000, 150000, 1);
        expect(b.hr).toBeCloseTo(85, 5);
        expect(b.calm).toBe(1);
        expect(b.escalating).toBe(1.5);
        expect(b.incidents).toBe(1);
    });
    it('returns empty buckets (null) when there is no data', () => {
        const [b] = bucketWindows([], 1000, 1000, 1);
        expect(b.hr).toBeNull();
    });
});
