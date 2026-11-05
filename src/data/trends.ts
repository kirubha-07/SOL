import type { ProcessedWindow } from './stateEngine';

export interface TrendBucket {
    t: number;
    label: string;
    hr: number | null;
    motion: number | null;
    /** Minutes spent in each state inside the bucket (30 s per window). */
    calm: number;
    elevated: number;
    escalating: number;
    exercise: number;
    /** Number of times the reported state entered Escalating inside the bucket. */
    incidents: number;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Where the reported state newly became `state` (entry points, not time spent). */
export function countEntries(windows: ProcessedWindow[], state: 'Elevated' | 'Escalating'): number[] {
    const out: number[] = [];
    let prev: ProcessedWindow['reported'] = null;
    for (const w of windows) {
        if (w.reported === state && prev !== state) out.push(w.start);
        if (w.label !== 'NoData') prev = w.reported;
    }
    return out;
}

export function bucketWindows(windows: ProcessedWindow[], now: number, rangeMs: number, nBuckets: number): TrendBucket[] {
    const start = now - rangeMs;
    const size = rangeMs / nBuckets;
    const inRange = windows.filter((w) => w.start >= start && w.start <= now);
    const entries = countEntries(windows, 'Escalating');
    const buckets: TrendBucket[] = [];
    for (let i = 0; i < nBuckets; i++) {
        const from = start + i * size;
        const to = from + size;
        const ws = inRange.filter((w) => w.start >= from && w.start < to);
        const valid = ws.filter((w) => w.label !== 'NoData');
        const mins = (pred: (w: ProcessedWindow) => boolean) => valid.filter(pred).length * 0.5;
        buckets.push({
            t: from,
            label: new Date(from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hr: avg(ws.filter((w) => w.meanHr !== null).map((w) => w.meanHr as number)),
            motion: avg(ws.filter((w) => w.meanMotion !== null).map((w) => w.meanMotion as number)),
            exercise: mins((w) => w.label === 'Exercise'),
            calm: mins((w) => w.label !== 'Exercise' && w.reported === 'Calm'),
            elevated: mins((w) => w.label !== 'Exercise' && w.reported === 'Elevated'),
            escalating: mins((w) => w.label !== 'Exercise' && w.reported === 'Escalating'),
            incidents: entries.filter((e) => e >= from && e < to).length,
        });
    }
    return buckets;
}
