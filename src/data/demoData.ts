// DEMO ONLY: a deterministic, simulated history so Trends has something to draw in Demo mode.
import { replay, windowIndex, type Baseline, type ProcessedWindow, type WindowStats } from './stateEngine';

export const DEMO_BASELINE: Baseline = { meanHr: 72, sdHr: 8, windows: 10, recordedAt: 0, quick: false };

export function makeDemoWindows(now: number, count = 240): ProcessedWindow[] {
    const end = windowIndex(now);
    const stats: WindowStats[] = [];
    for (let i = 0; i < count; i++) {
        const idx = end - count + i;
        const episode = (i % 80) >= 50 && (i % 80) < 58; // a short simulated episode every 80 windows
        const bout = (i % 55) >= 30 && (i % 55) < 34; // simulated high-motion play
        const hr = 72 + 4 * Math.sin(i / 7) + (episode ? 30 : 0) + (bout ? 20 : 0);
        const motion = 0.06 + 0.04 * Math.sin(i / 5) + (bout ? 0.6 : 0) + (episode ? 0.15 : 0);
        stats.push({ idx, start: idx * 30000, end: (idx + 1) * 30000, meanHr: hr, meanMotion: motion, nHr: 7 });
    }
    return replay(stats, DEMO_BASELINE).windows;
}
