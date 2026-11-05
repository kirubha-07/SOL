import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { DataMode } from './demoContext';
import type { SensoryState } from './types';
import type { Vitals } from './useVitals';
import { readJSON, writeJSON } from './localStore';
import { DEMO_BASELINE, makeDemoWindows } from './demoData';
import { useSettings } from './settings';
import {
    BASELINE_WINDOWS, DEFAULT_CONFIG, QUICK_BASELINE_WINDOWS, computeBaseline, initialPersistence, processWindow,
    summarizeWindow, thresholds, windowIndex, type Baseline, type EngineConfig, type Persistence, type ProcessedWindow, type Sample,
} from './stateEngine';
import { SolContext } from './solContext';

/** 24 h of 30 s windows. */
const MAX_STORED_WINDOWS = 2880;

export interface Calibration {
    target: number;
    collected: number;
    quick: boolean;
    startedAt: number;
}

export interface SolStateValue {
    /** Reported state, or null when it is not known yet (no baseline, calibrating, waiting for the first window). */
    state: SensoryState | null;
    baseline: Baseline | null;
    windows: ProcessedWindow[];
    calibrating: Calibration | null;
    startCalibration: () => void;
    /** 60 s calibration. Demo/testing only. */
    quickCalibration: () => void;
    cancelCalibration: () => void;
    /** Pending change: which state is waiting, how many consecutive windows it has, and how many it needs. */
    persistence: { candidate: SensoryState | null; streak: number; required: number };
    lastWindow: ProcessedWindow | null;
    thresholds: { sd: number; elevatedAt: number; escalatingAt: number } | null;
    config: EngineConfig;
    isDemo: boolean;
}

/** Runs the engine. Mounted once by SolProvider so windows keep accumulating on every page. */
export function useSolSource(mode: DataMode, demoState: SensoryState, vitals: Vitals): SolStateValue {
    const settings = useSettings();
    const config = useMemo<EngineConfig>(
        () => ({ ...DEFAULT_CONFIG, motionThreshold: settings.motionThreshold, persistenceWindows: settings.persistenceWindows }),
        [settings.motionThreshold, settings.persistenceWindows]
    );

    const [baseline, setBaseline] = useState<Baseline | null>(() => readJSON<Baseline | null>('baseline', null));
    const [windows, setWindows] = useState<ProcessedWindow[]>(() => readJSON<ProcessedWindow[]>('windows', []));
    const [mem, setMem] = useState<Persistence>(initialPersistence);
    const [calibrating, setCalibrating] = useState<Calibration | null>(null);

    const baselineRef = useRef(baseline);
    const memRef = useRef(mem);
    const configRef = useRef(config);
    const calibRef = useRef<{ cal: Calibration; hrs: number[] } | null>(null);
    const bucketRef = useRef<{ idx: number; samples: Sample[] } | null>(null);
    useEffect(() => {
        baselineRef.current = baseline;
        configRef.current = config;
    }, [baseline, config]);

    const closeBucket = useCallback((b: { idx: number; samples: Sample[] }) => {
        const cfg = configRef.current;
        const stats = summarizeWindow(b.idx, b.samples);
        const calib = calibRef.current;

        if (calib) {
            const usable = stats.meanHr !== null && stats.meanMotion !== null && stats.nHr >= cfg.minSamples && stats.meanMotion <= cfg.motionThreshold;
            if (!usable) return; // moving about or no signal: not a resting window, keep waiting
            calib.hrs.push(stats.meanHr as number);
            calib.cal = { ...calib.cal, collected: calib.hrs.length };
            if (calib.hrs.length >= calib.cal.target) {
                const b2 = computeBaseline(calib.hrs, calib.cal.quick, Date.now());
                calibRef.current = null;
                setCalibrating(null);
                if (b2) {
                    writeJSON('baseline', b2);
                    baselineRef.current = b2;
                    setBaseline(b2);
                    memRef.current = initialPersistence();
                    setMem(memRef.current);
                }
            } else {
                setCalibrating(calib.cal);
            }
            return;
        }

        const base = baselineRef.current;
        if (!base) return;
        const r = processWindow(memRef.current, stats, base, cfg);
        memRef.current = r.mem;
        setMem(r.mem);
        setWindows((prev) => {
            const next = [...prev, r.window].slice(-MAX_STORED_WINDOWS);
            writeJSON('windows', next);
            return next;
        });
    }, []);

    // Feed each fresh live sample into 30 s buckets.
    const lastFed = useRef<number | null>(null);
    useEffect(() => {
        if (mode !== 'live' || vitals.status !== 'live' || vitals.lastUpdated === null) return;
        if (lastFed.current === vitals.lastUpdated) return;
        lastFed.current = vitals.lastUpdated;
        const t = vitals.lastUpdated;
        const sample: Sample = { t, hr: vitals.hrValid ? vitals.hr : null, motion: vitals.motion };
        const idx = windowIndex(t);
        const cur = bucketRef.current;
        if (cur && cur.idx !== idx) {
            closeBucket(cur);
            bucketRef.current = { idx, samples: [sample] };
        } else if (cur) {
            cur.samples.push(sample);
        } else {
            bucketRef.current = { idx, samples: [sample] };
        }
    }, [mode, vitals.status, vitals.lastUpdated, vitals.hr, vitals.hrValid, vitals.motion, closeBucket]);

    const begin = useCallback((quick: boolean) => {
        const cal: Calibration = { target: quick ? QUICK_BASELINE_WINDOWS : BASELINE_WINDOWS, collected: 0, quick, startedAt: Date.now() };
        calibRef.current = { cal, hrs: [] };
        bucketRef.current = null; // start on a fresh window boundary
        setCalibrating(cal);
    }, []);
    const startCalibration = useCallback(() => begin(false), [begin]);
    const quickCalibration = useCallback(() => begin(true), [begin]);
    const cancelCalibration = useCallback(() => {
        calibRef.current = null;
        setCalibrating(null);
    }, []);

    // Changing the rules (motion threshold / persistence) restarts the pending streak.
    useEffect(() => {
        memRef.current = { ...memRef.current, candidate: null, streak: 0 };
        setMem(memRef.current);
    }, [config]);

    const [startedAt] = useState(() => Date.now());
    const demoWindows = useMemo(() => (mode === 'demo' ? makeDemoWindows(startedAt) : []), [mode, startedAt]);

    return useMemo<SolStateValue>(() => {
        const noop = () => {};
        if (mode === 'demo') {
            return {
                state: demoState,
                baseline: DEMO_BASELINE,
                windows: demoWindows,
                calibrating: null,
                startCalibration: noop,
                quickCalibration: noop,
                cancelCalibration: noop,
                persistence: { candidate: null, streak: 0, required: config.persistenceWindows },
                lastWindow: demoWindows[demoWindows.length - 1] ?? null,
                thresholds: thresholds(DEMO_BASELINE, config),
                config,
                isDemo: true,
            };
        }
        return {
            state: baseline && !calibrating ? mem.reported : null,
            baseline,
            windows,
            calibrating,
            startCalibration,
            quickCalibration,
            cancelCalibration,
            persistence: { candidate: mem.candidate, streak: mem.streak, required: config.persistenceWindows },
            lastWindow: windows[windows.length - 1] ?? null,
            thresholds: baseline ? thresholds(baseline, config) : null,
            config,
            isDemo: false,
        };
    }, [mode, demoState, demoWindows, baseline, calibrating, mem, windows, config, startCalibration, quickCalibration, cancelCalibration]);
}

export function useSolState(): SolStateValue {
    const v = useContext(SolContext);
    if (!v) throw new Error('useSolState must be used within a SolProvider');
    return v;
}
