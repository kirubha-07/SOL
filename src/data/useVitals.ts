import { useContext, useCallback, useEffect, useRef, useState } from 'react';
import type { DataMode } from './demoContext';
import type { SensoryState } from './types';
import { mockSensorData } from './mockData';
import { VitalsContext } from './vitalsContext';

export type VitalsStatus = 'live' | 'stale' | 'disconnected' | 'demo';

export interface VitalSample {
    t: number;
    hr: number | null;
    spo2: number | null;
    motion: number | null;
}

export interface Vitals {
    spo2: number | null;
    hr: number | null;
    /** g deviation from 1 g (band datastream V4). */
    motion: number | null;
    connected: boolean;
    /** Time (ms) of the last successful read, or null if none yet. */
    lastUpdated: number | null;
    status: VitalsStatus;
    /** True until the first response (or failure) arrives. */
    loading: boolean;
    error: string | null;
    /** A positive heart rate / SpO2 means the sensor has a finger on it. 0 or missing = no finger. */
    hrValid: boolean;
    spo2Valid: boolean;
    /** Last 5 minutes of samples (only samples taken while the band was connected). */
    history: VitalSample[];
    sendCommand: (pin: 'v3' | 'v5', value: 0 | 1) => Promise<void>;
}

export const POLL_MS = 4000;
/** Older than this = "Disconnected" and values are greyed out. */
export const STALE_MS = 15_000;
/** If the band is connected but every value is byte-identical for this long, treat the data as frozen. */
export const FROZEN_MS = 30_000;
export const HISTORY_MS = 5 * 60 * 1000;

/** Pure freshness rule, exported for tests. */
export function computeStatus(args: {
    mode: DataMode;
    now: number;
    lastOkAt: number | null;
    connected: boolean;
    lastChangeAt: number | null;
    motionAvailable: boolean;
}): VitalsStatus {
    if (args.mode === 'demo') return 'demo';
    if (args.lastOkAt === null) return 'disconnected';
    if (args.now - args.lastOkAt > STALE_MS) return 'stale';
    if (!args.connected) return 'disconnected';
    if (args.motionAvailable && args.lastChangeAt !== null && args.now - args.lastChangeAt > FROZEN_MS) return 'stale';
    return 'live';
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Does the actual polling. Mounted once by VitalsProvider; screens use useVitals(). */
export function useVitalsSource(mode: DataMode, demoState: SensoryState): Vitals {
    const [latest, setLatest] = useState<{ spo2: number | null; hr: number | null; motion: number | null; connected: boolean } | null>(null);
    const [lastOkAt, setLastOkAt] = useState<number | null>(null);
    const [lastChangeAt, setLastChangeAt] = useState<number | null>(null);
    const [history, setHistory] = useState<VitalSample[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<VitalsStatus>(mode === 'demo' ? 'demo' : 'disconnected');
    const ref = useRef({ lastOkAt: null as number | null, lastChangeAt: null as number | null, connected: false, motion: null as number | null, sig: '' });
    const startedRef = useRef(false);

    const sendCommand = useCallback(async (pin: 'v3' | 'v5', value: 0 | 1) => {
        const r = await fetch('/api/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, value }),
        });
        if (!r.ok) {
            const j = await r.json().catch(() => null);
            throw new Error(j?.error ?? `HTTP ${r.status}`);
        }
    }, []);

    const record = useCallback((s: VitalSample, connected: boolean) => {
        const now = s.t;
        const sig = `${s.spo2}|${s.hr}|${s.motion}`;
        const r = ref.current;
        if (sig !== r.sig || r.lastChangeAt === null) {
            r.sig = sig;
            r.lastChangeAt = now;
            setLastChangeAt(now);
        }
        r.lastOkAt = now;
        r.connected = connected;
        r.motion = s.motion;
        setLastOkAt(now);
        setLatest({ spo2: s.spo2, hr: s.hr, motion: s.motion, connected });
        if (connected) setHistory((h) => [...h.filter((x) => x.t > now - HISTORY_MS), s]);
    }, []);

    // Reset when the data source changes so live and demo numbers never mix.
    useEffect(() => {
        ref.current = { lastOkAt: null, lastChangeAt: null, connected: false, motion: null, sig: '' };
        startedRef.current = false;
        setLatest(null);
        setLastOkAt(null);
        setLastChangeAt(null);
        setHistory([]);
        setError(null);
        setLoading(mode === 'live');
    }, [mode]);

    // LIVE: poll the proxy every 4 s.
    useEffect(() => {
        if (mode !== 'live') return;
        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const ctrl = new AbortController();

        const tick = async () => {
            const timeout = setTimeout(() => ctrl.abort(), 8000);
            try {
                const r = await fetch('/api/vitals', { cache: 'no-store', signal: ctrl.signal });
                const j = await r.json().catch(() => null);
                if (!r.ok || !j) throw new Error(j?.error ?? `HTTP ${r.status}`);
                if (stopped) return;
                record({ t: Date.now(), hr: num(j.hr), spo2: num(j.spo2), motion: num(j.motion) }, j.connected === true);
                setError(null);
            } catch (e) {
                if (stopped) return;
                setError(e instanceof Error ? e.message : 'Request failed');
            } finally {
                clearTimeout(timeout);
                if (!stopped) {
                    setLoading(false);
                    timer = setTimeout(tick, POLL_MS);
                }
            }
        };
        tick();
        return () => {
            stopped = true;
            ctrl.abort();
            if (timer) clearTimeout(timer);
        };
    }, [mode, record]);

    // DEMO: simulated samples (clearly labelled "DEMO" in the UI).
    useEffect(() => {
        if (mode !== 'demo') return;
        const push = () => {
            const base = mockSensorData[demoState];
            const jitter = (Math.random() - 0.5) * 6;
            record({ t: Date.now(), hr: Math.round(base.heartRate + jitter), spo2: base.spo2, motion: base.motion }, true);
        };
        push();
        const id = setInterval(push, POLL_MS);
        return () => clearInterval(id);
    }, [mode, demoState, record]);

    // Re-evaluate freshness once a second without re-rendering unless the status changes.
    useEffect(() => {
        const evaluate = () => {
            const r = ref.current;
            const next = computeStatus({
                mode,
                now: Date.now(),
                lastOkAt: r.lastOkAt,
                connected: r.connected,
                lastChangeAt: r.lastChangeAt,
                motionAvailable: r.motion !== null,
            });
            setStatus((prev) => (prev === next ? prev : next));
        };
        evaluate();
        const id = setInterval(evaluate, 1000);
        return () => clearInterval(id);
    }, [mode, lastOkAt, lastChangeAt]);

    // The band only streams after the app sets V3 = 1. Do it whenever it (re)connects.
    useEffect(() => {
        if (mode !== 'live') return;
        if (status === 'live' && !startedRef.current) {
            startedRef.current = true;
            sendCommand('v3', 1).catch(() => {
                startedRef.current = false;
            });
        } else if (status === 'disconnected') {
            startedRef.current = false;
        }
    }, [mode, status, sendCommand]);

    return {
        spo2: latest?.spo2 ?? null,
        hr: latest?.hr ?? null,
        motion: latest?.motion ?? null,
        connected: latest?.connected ?? false,
        lastUpdated: lastOkAt,
        status,
        loading,
        error,
        hrValid: (latest?.hr ?? 0) > 0,
        spo2Valid: (latest?.spo2 ?? 0) > 0,
        history,
        sendCommand,
    };
}

export function useVitals(): Vitals {
    const v = useContext(VitalsContext);
    if (!v) throw new Error('useVitals must be used within a VitalsProvider');
    return v;
}
