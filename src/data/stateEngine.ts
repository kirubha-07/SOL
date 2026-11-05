// Rule-based state engine. Pure functions only (no React, no storage, no clock) so it is unit-testable.
//
// Method:
//  1. Baseline: 10 windows of 30 s (5 min) at rest -> mean and SD of window heart rate.
//  2. Samples (every ~4 s) are aggregated into 30 s windows (mean heart rate, mean motion).
//  3. Motion gate: a window whose mean motion > MOTION_EXERCISE_THRESHOLD is "Exercise", never stress.
//  4. Otherwise: Escalating if hr > mean + 4*SD, Elevated if hr > mean + 2*SD, else Calm.
//  5. Persistence: a new state is reported only after it appears in N consecutive windows.
import type { SensoryState } from './types';

export const WINDOW_MS = 30_000;
export const BASELINE_WINDOWS = 10; // 10 x 30 s = 5 min
export const QUICK_BASELINE_WINDOWS = 2; // 60 s, demo only
export const MOTION_EXERCISE_THRESHOLD = 0.45; // g
export const ELEVATED_SD_MULTIPLIER = 2;
export const ESCALATING_SD_MULTIPLIER = 4;
export const PERSISTENCE_WINDOWS = 2;
/** A window needs at least this many valid samples to be judged (4 s polling gives ~7 per window). */
export const MIN_SAMPLES_PER_WINDOW = 3;
/**
 * Safety floor for the baseline SD. With very steady resting data (or the 2-window quick
 * calibration) the SD can be ~0, which would make every tiny rise "Elevated". This is a
 * deliberate addition to the method above.
 */
export const MIN_BASELINE_SD = 1; // bpm

export interface EngineConfig {
    motionThreshold: number;
    persistenceWindows: number;
    elevatedMultiplier: number;
    escalatingMultiplier: number;
    minSd: number;
    minSamples: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
    motionThreshold: MOTION_EXERCISE_THRESHOLD,
    persistenceWindows: PERSISTENCE_WINDOWS,
    elevatedMultiplier: ELEVATED_SD_MULTIPLIER,
    escalatingMultiplier: ESCALATING_SD_MULTIPLIER,
    minSd: MIN_BASELINE_SD,
    minSamples: MIN_SAMPLES_PER_WINDOW,
};

/** hr is null when no finger / invalid; motion is null when the band did not report it. */
export interface Sample {
    t: number;
    hr: number | null;
    motion: number | null;
}

export interface Baseline {
    meanHr: number;
    sdHr: number;
    windows: number;
    recordedAt: number;
    quick: boolean;
}

export interface WindowStats {
    idx: number;
    start: number;
    end: number;
    meanHr: number | null;
    meanMotion: number | null;
    nHr: number;
}

export type WindowLabel = SensoryState | 'Exercise' | 'NoData';

export interface Persistence {
    /** The state shown to the caregiver. null until the first window is judged. */
    reported: SensoryState | null;
    candidate: SensoryState | null;
    /** How many consecutive windows the candidate has appeared in. */
    streak: number;
    lastIdx: number | null;
}

export const initialPersistence = (): Persistence => ({ reported: null, candidate: null, streak: 0, lastIdx: null });

export const windowIndex = (t: number, windowMs = WINDOW_MS) => Math.floor(t / windowMs);

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Sample standard deviation (n-1). */
export function stdDev(xs: number[]): number {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

export function summarizeWindow(idx: number, samples: Sample[], windowMs = WINDOW_MS): WindowStats {
    const hrs = samples.filter((s) => s.hr !== null && s.hr > 0).map((s) => s.hr as number);
    const motions = samples.filter((s) => s.motion !== null).map((s) => s.motion as number);
    return {
        idx,
        start: idx * windowMs,
        end: (idx + 1) * windowMs,
        meanHr: hrs.length ? mean(hrs) : null,
        meanMotion: motions.length ? mean(motions) : null,
        nHr: hrs.length,
    };
}

export function computeBaseline(windowHrs: number[], quick: boolean, now: number): Baseline | null {
    if (windowHrs.length < 2) return null;
    return { meanHr: mean(windowHrs), sdHr: stdDev(windowHrs), windows: windowHrs.length, recordedAt: now, quick };
}

export function thresholds(b: Baseline, cfg: EngineConfig = DEFAULT_CONFIG) {
    const sd = Math.max(b.sdHr, cfg.minSd);
    return {
        sd,
        elevatedAt: b.meanHr + cfg.elevatedMultiplier * sd,
        escalatingAt: b.meanHr + cfg.escalatingMultiplier * sd,
    };
}

export function classifyWindow(w: WindowStats, b: Baseline, cfg: EngineConfig = DEFAULT_CONFIG): WindowLabel {
    if (w.meanHr === null || w.meanMotion === null || w.nHr < cfg.minSamples) return 'NoData';
    if (w.meanMotion > cfg.motionThreshold) return 'Exercise';
    const t = thresholds(b, cfg);
    if (w.meanHr > t.escalatingAt) return 'Escalating';
    if (w.meanHr > t.elevatedAt) return 'Elevated';
    return 'Calm';
}

/** Apply the persistence rule for one new window. */
export function stepPersistence(mem: Persistence, w: WindowStats, label: WindowLabel, cfg: EngineConfig = DEFAULT_CONFIG): Persistence {
    // No usable data: keep the reported state but break the "consecutive" chain.
    if (label === 'NoData') return { ...mem, candidate: null, streak: 0, lastIdx: w.idx };

    // Exercise is "not stress": it counts as Calm for the state machine (and cannot escalate).
    const target: SensoryState = label === 'Exercise' ? 'Calm' : label;
    const consecutive = mem.lastIdx === null || w.idx === mem.lastIdx + 1;
    const prevCandidate = consecutive ? mem.candidate : null;
    const prevStreak = consecutive ? mem.streak : 0;

    const current: SensoryState = mem.reported ?? 'Calm';
    if (target === current) {
        // Back at the reported state (or first calm window): any pending change is cancelled.
        return { reported: current, candidate: null, streak: 0, lastIdx: w.idx };
    }
    const streak = prevCandidate === target ? prevStreak + 1 : 1;
    if (streak >= cfg.persistenceWindows) return { reported: target, candidate: null, streak: 0, lastIdx: w.idx };
    return { reported: mem.reported, candidate: target, streak, lastIdx: w.idx };
}

export interface ProcessedWindow extends WindowStats {
    label: WindowLabel;
    /** State reported after this window. */
    reported: SensoryState | null;
}

export function processWindow(mem: Persistence, w: WindowStats, b: Baseline, cfg: EngineConfig = DEFAULT_CONFIG) {
    const label = classifyWindow(w, b, cfg);
    const next = stepPersistence(mem, w, label, cfg);
    const processed: ProcessedWindow = { ...w, label, reported: next.reported };
    return { mem: next, window: processed };
}

/** Run a list of consecutive windows through the engine (used by tests and for replay). */
export function replay(windows: WindowStats[], b: Baseline, cfg: EngineConfig = DEFAULT_CONFIG) {
    let mem = initialPersistence();
    const out: ProcessedWindow[] = [];
    for (const w of windows) {
        const r = processWindow(mem, w, b, cfg);
        mem = r.mem;
        out.push(r.window);
    }
    return { mem, windows: out };
}
