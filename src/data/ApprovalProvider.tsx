import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDemoMode } from './demoContext';
import { mockSensorData } from './mockData';
import { useVitals } from './useVitals';
import { useSolState } from './useSolState';
import { useDisplayState } from './useDisplayState';
import { getSettings } from './settings';
import { readJSON, writeJSON } from './localStore';
import { buildActions } from './actions';
import {
    MAX_EVENTS, chooseAction, closeStaleRecoveries, computeStats, expirePending, isPending, newEvent, rankActions, resolveRecoveries,
    type SolEvent,
} from './eventLog';
import type { SensoryState } from './types';
import { ApprovalContext, type ApprovalValue } from './approvalContext';

type Mode = 'live' | 'demo';
type Store = Record<Mode, SolEvent[]>;

const load = (m: Mode) => closeStaleRecoveries(readJSON<SolEvent[]>(`${m}.events`, []), Date.now());
const makeId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

export const ApprovalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { dataMode: mode } = useDemoMode();
    const vitals = useVitals();
    const sol = useSolState();
    const display = useDisplayState();
    const reported = display.state;

    const [store, setStore] = useState<Store>(() => ({ live: load('live'), demo: load('demo') }));
    const [lastResult, setLastResult] = useState<{ message: string; ok: boolean } | null>(null);

    useEffect(() => writeJSON('live.events', store.live), [store.live]);
    useEffect(() => writeJSON('demo.events', store.demo), [store.demo]);

    const updateMode = useCallback((m: Mode, fn: (e: SolEvent[]) => SolEvent[]) => {
        setStore((s) => {
            const next = fn(s[m]);
            return next === s[m] ? s : { ...s, [m]: next };
        });
    }, []);

    const modeRef = useRef(mode);
    const cur = useRef<{ state: SensoryState | null; since: number }>({ state: null, since: 0 });
    const prev = useRef<{ mode: Mode; state: SensoryState | null }>({ mode, state: null });
    const latest = useRef({ sol });
    useEffect(() => {
        modeRef.current = mode;
        latest.current = { sol };
    });

    const actions = useMemo(
        () => buildActions({ isDemo: () => modeRef.current === 'demo', bridgeUrl: () => getSettings().bridgeUrl, sendCommand: vitals.sendCommand }),
        [vitals.sendCommand]
    );

    // React to the reported state changing (never to a momentary disconnect: null is ignored).
    useEffect(() => {
        if (reported === null) return;
        const before = prev.current.mode === mode ? prev.current.state : null;
        if (reported === before) return;
        prev.current = { mode, state: reported };
        const now = Date.now();
        cur.current = { state: reported, since: now };

        if (reported === 'Calm') {
            updateMode(mode, (evts) => resolveRecoveries(expirePending(evts, now, 'Calm'), now, cur.current));
            return;
        }
        const { sol: s } = latest.current;
        const w = s.lastWindow;
        const demo = mode === 'demo';
        const trigger = {
            hr: demo ? mockSensorData[reported].heartRate : w?.meanHr ?? null,
            baselineMean: s.baseline?.meanHr ?? null,
            baselineSd: s.baseline?.sdHr ?? null,
            elevatedAt: s.thresholds?.elevatedAt ?? null,
            escalatingAt: s.thresholds?.escalatingAt ?? null,
            motion: demo ? mockSensorData[reported].motion : w?.meanMotion ?? null,
            motionThreshold: s.config.motionThreshold,
        };
        updateMode(mode, (evts) => {
            const closed = expirePending(evts, now, reported);
            const actionId = reported === 'Escalating' ? chooseAction(closed) : null;
            return [newEvent({ id: makeId(), t: now, state: reported, trigger, actionId }), ...closed].slice(0, MAX_EVENTS);
        });
    }, [reported, mode, updateMode]);

    // Once a second: expire unanswered suggestions and close recovery timers.
    useEffect(() => {
        const id = setInterval(() => {
            const now = Date.now();
            updateMode(modeRef.current, (evts) => resolveRecoveries(expirePending(evts, now, cur.current.state), now, cur.current));
        }, 1000);
        return () => clearInterval(id);
    }, [updateMode]);

    const events = store[mode];
    const pending = useMemo(() => events.find(isPending) ?? null, [events]);
    const tracking = useMemo(() => events.find((e) => e.recoveryStatus === 'pending') ?? null, [events]);
    const stats = useMemo(() => computeStats(events), [events]);
    const ranking = useMemo(() => rankActions(stats), [stats]);
    const nextAction = useMemo(() => chooseAction(events), [events]);
    const pendingRef = useRef(pending);
    useEffect(() => {
        pendingRef.current = pending;
    });

    const approve = useCallback(() => {
        const ev = pendingRef.current;
        const m = modeRef.current;
        if (!ev || !ev.actionId) return;
        const now = Date.now();
        if (ev.expiresAt !== null && now >= ev.expiresAt) return;
        const action = actions[ev.actionId];
        // run() is called synchronously inside the click so the browser allows audio playback.
        const running = action.run();
        updateMode(m, (evts) => evts.map((e) => (e.id === ev.id ? { ...e, decision: 'approved' as const, decidedAt: now, note: null, recoveryStatus: 'pending' as const } : e)));
        running.then(
            () => {
                updateMode(m, (evts) => evts.map((e) => (e.id === ev.id ? { ...e, executed: true } : e)));
                const simulated = ev.actionId === 'dim-light' && (m === 'demo' || !getSettings().bridgeUrl.trim());
                setLastResult({ ok: true, message: `Approved: ${action.label}${simulated ? ' (simulated bulb)' : ''}${ev.actionId === 'haptic' && m === 'demo' ? ' (simulated, nothing sent)' : ''}.` });
            },
            (err: unknown) => {
                const msg = err instanceof Error ? err.message : 'unknown error';
                // It never ran, so it must not count as a recovery trial.
                updateMode(m, (evts) =>
                    evts.map((e) => (e.id === ev.id ? { ...e, executed: false, execError: msg, recoveryStatus: null, note: 'Approved but the action did not run' } : e))
                );
                setLastResult({ ok: false, message: `Approved, but it did not run: ${msg}` });
            }
        );
    }, [actions, updateMode]);

    const notNow = useCallback(() => {
        const ev = pendingRef.current;
        if (!ev) return;
        const now = Date.now();
        updateMode(modeRef.current, (evts) => evts.map((e) => (e.id === ev.id ? { ...e, decision: 'not-now' as const, decidedAt: now, note: 'Caregiver chose not now: no action' } : e)));
    }, [updateMode]);

    const value = useMemo<ApprovalValue>(
        () => ({ mode, events, pending, tracking, stats, ranking, nextAction, actions, approve, notNow, lastResult, clearResult: () => setLastResult(null) }),
        [mode, events, pending, tracking, stats, ranking, nextAction, actions, approve, notNow, lastResult]
    );
    return <ApprovalContext.Provider value={value}>{children}</ApprovalContext.Provider>;
};
