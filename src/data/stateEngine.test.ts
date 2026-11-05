import { describe, it, expect } from 'vitest';
import {
    DEFAULT_CONFIG, MOTION_EXERCISE_THRESHOLD, computeBaseline, replay, summarizeWindow, thresholds,
    type Baseline, type WindowStats,
} from './stateEngine';

// Baseline: mean 70, SD 5 -> Elevated above 80, Escalating above 90.
const baseline: Baseline = { meanHr: 70, sdHr: 5, windows: 10, recordedAt: 0, quick: false };

const win = (idx: number, hr: number | null, motion: number | null = 0.1): WindowStats => ({
    idx, start: idx * 30000, end: (idx + 1) * 30000, meanHr: hr, meanMotion: motion, nHr: hr === null ? 0 : 7,
});
const run = (hrs: Array<[number, number?]>) =>
    replay(hrs.map(([hr, m], i) => win(i, hr, m ?? 0.1)), baseline).windows.map((w) => w.reported);

describe('thresholds', () => {
    it('uses mean + 2*SD and mean + 4*SD', () => {
        const t = thresholds(baseline);
        expect(t.elevatedAt).toBe(80);
        expect(t.escalatingAt).toBe(90);
    });
});

describe('computeBaseline', () => {
    it('computes mean and sample SD', () => {
        const b = computeBaseline([68, 70, 72, 70], false, 1)!;
        expect(b.meanHr).toBe(70);
        expect(b.sdHr).toBeCloseTo(1.633, 2);
    });
    it('needs at least 2 windows', () => {
        expect(computeBaseline([70], false, 1)).toBeNull();
    });
});

describe('summarizeWindow', () => {
    it('averages valid samples and ignores no-finger (null/0) heart rates', () => {
        const w = summarizeWindow(1, [
            { t: 1, hr: 70, motion: 0.1 }, { t: 2, hr: 0, motion: 0.3 }, { t: 3, hr: null, motion: 0.2 }, { t: 4, hr: 74, motion: 0.2 },
        ]);
        expect(w.meanHr).toBe(72);
        expect(w.nHr).toBe(2);
        expect(w.meanMotion).toBeCloseTo(0.2, 5);
    });
});

describe('state engine', () => {
    it('calm stays calm', () => {
        expect(run([[70], [72], [68], [71]])).toEqual(['Calm', 'Calm', 'Calm', 'Calm']);
    });

    it('a single-window HR spike does not change the state', () => {
        expect(run([[70], [70], [95], [70], [70]])).toEqual(['Calm', 'Calm', 'Calm', 'Calm', 'Calm']);
    });

    it('two consecutive Elevated windows change the state', () => {
        expect(run([[70], [85], [85], [85]])).toEqual(['Calm', 'Calm', 'Elevated', 'Elevated']);
    });

    it('two consecutive Escalating windows change the state', () => {
        expect(run([[70], [95], [95]])).toEqual(['Calm', 'Calm', 'Escalating']);
    });

    it('high motion blocks escalation (Exercise)', () => {
        const hi = MOTION_EXERCISE_THRESHOLD + 0.2;
        expect(run([[70], [120, hi], [120, hi], [120, hi]])).toEqual(['Calm', 'Calm', 'Calm', 'Calm']);
        const { windows } = replay([win(0, 70), win(1, 120, hi)], baseline);
        expect(windows[1].label).toBe('Exercise');
    });

    it('motion exactly at the threshold is not Exercise', () => {
        const { windows } = replay([win(0, 95, MOTION_EXERCISE_THRESHOLD)], baseline);
        expect(windows[0].label).toBe('Escalating');
    });

    it('persistence resets when a window drops back to Calm', () => {
        // Elevated, Calm, Elevated: never two in a row, so no change.
        expect(run([[70], [85], [70], [85], [70]])).toEqual(['Calm', 'Calm', 'Calm', 'Calm', 'Calm']);
    });

    it('a different non-calm state restarts the streak', () => {
        // Elevated then Escalating then Escalating -> Escalating only after two Escalating in a row.
        expect(run([[70], [85], [95], [95]])).toEqual(['Calm', 'Calm', 'Calm', 'Escalating']);
    });

    it('returns to Calm only after two Calm windows', () => {
        expect(run([[70], [95], [95], [70], [70]])).toEqual(['Calm', 'Calm', 'Escalating', 'Escalating', 'Calm']);
    });

    it('does not report a state before the first window is judged, and not a stress state from one window', () => {
        expect(run([[95], [95]])).toEqual([null, 'Escalating']);
        expect(run([[70]])).toEqual(['Calm']);
    });

    it('no-data windows keep the state and break the streak', () => {
        expect(run([[70], [85], [null as unknown as number], [85]])).toEqual(['Calm', 'Calm', 'Calm', 'Calm']);
    });

    it('a gap in window indexes breaks the streak', () => {
        const { windows } = replay([win(0, 70), win(1, 85), win(5, 85)], baseline);
        expect(windows.map((w) => w.reported)).toEqual(['Calm', 'Calm', 'Calm']);
    });

    it('respects a custom persistence setting', () => {
        const { windows } = replay([win(0, 70), win(1, 85)], baseline, { ...DEFAULT_CONFIG, persistenceWindows: 1 });
        expect(windows[1].reported).toBe('Elevated');
    });
});
