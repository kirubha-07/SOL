import { describe, it, expect } from 'vitest';
import {
    APPROVAL_TIMEOUT_MS, RECOVERY_GIVE_UP_MS, chooseAction, closeStaleRecoveries, computeStats, eventsToCsv, expirePending, newEvent, rankActions,
    resolveRecoveries, type ActionId, type EventTrigger, type SolEvent,
} from './eventLog';

const trig: EventTrigger = { hr: 105, baselineMean: 70, baselineSd: 5, elevatedAt: 80, escalatingAt: 90, motion: 0.1, motionThreshold: 0.45 };
const ev = (over: Partial<SolEvent> & { actionId: ActionId }): SolEvent => ({ ...newEvent({ id: 'x', t: 0, state: 'Escalating', trigger: trig, actionId: over.actionId }), ...over });
const done = (actionId: ActionId, sec: number | null): SolEvent =>
    ev({ actionId, decision: 'approved', decidedAt: 0, recoveryStatus: sec === null ? 'not-recovered' : 'recovered', recoverySec: sec });

describe('expiry', () => {
    it('does nothing before 120 s', () => {
        const e = [ev({ actionId: 'dim-light' })];
        expect(expirePending(e, APPROVAL_TIMEOUT_MS - 1, 'Escalating')).toBe(e);
    });
    it('expires after 120 s with no action', () => {
        const [x] = expirePending([ev({ actionId: 'dim-light' })], APPROVAL_TIMEOUT_MS, 'Escalating');
        expect(x.decision).toBe('expired');
        expect(x.executed).toBeNull();
        expect(x.note).toMatch(/expired, no action/);
    });
    it('expires if the state left Escalating before an answer', () => {
        expect(expirePending([ev({ actionId: 'dim-light' })], 1000, 'Calm')[0].decision).toBe('expired');
    });
    it('does not expire on an unknown (null) state', () => {
        const e = [ev({ actionId: 'dim-light' })];
        expect(expirePending(e, 1000, null)).toBe(e);
    });
    it('quiet Elevated notes have no suggestion to expire', () => {
        const q = newEvent({ id: 'q', t: 0, state: 'Elevated', trigger: trig, actionId: null });
        expect(q.expiresAt).toBeNull();
        expect(expirePending([q], 10 * APPROVAL_TIMEOUT_MS, 'Elevated')[0].decision).toBeNull();
    });
});

describe('recovery', () => {
    const pending = ev({ actionId: 'dim-light', decision: 'approved', decidedAt: 1000, recoveryStatus: 'pending' });
    it('measures seconds from approve to Calm', () => {
        const [r] = resolveRecoveries([pending], 100_000, { state: 'Calm', since: 91_000 });
        expect(r.recoveryStatus).toBe('recovered');
        expect(r.recoverySec).toBe(90);
    });
    it('ignores a Calm that started before the approval', () => {
        const e = [pending];
        expect(resolveRecoveries(e, 5000, { state: 'Calm', since: 500 })).toBe(e);
    });
    it('keeps waiting while not Calm', () => {
        const e = [pending];
        expect(resolveRecoveries(e, 1000 + RECOVERY_GIVE_UP_MS - 1, { state: 'Escalating', since: 0 })).toBe(e);
    });
    it('gives up after 15 minutes -> not recovered', () => {
        const [r] = resolveRecoveries([pending], 1000 + RECOVERY_GIVE_UP_MS, { state: 'Elevated', since: 0 });
        expect(r.recoveryStatus).toBe('not-recovered');
    });
    it('does not count a recovery that happened after the deadline', () => {
        const [r] = resolveRecoveries([pending], 1000 + RECOVERY_GIVE_UP_MS + 5000, { state: 'Calm', since: 1000 + RECOVERY_GIVE_UP_MS + 4000 });
        expect(r.recoveryStatus).toBe('not-recovered');
    });
    it('marks recoveries that were not watched (app closed) as unknown', () => {
        const [r] = closeStaleRecoveries([pending], 1000 + RECOVERY_GIVE_UP_MS);
        expect(r.recoveryStatus).toBe('unknown');
    });
});

describe('ranking', () => {
    it('suggests actions with no data first, once each, in default order', () => {
        expect(chooseAction([])).toBe('dim-light');
        expect(chooseAction([done('dim-light', 300)])).toBe('calm-audio');
        expect(chooseAction([done('dim-light', 300), done('calm-audio', 100)])).toBe('haptic');
    });
    it('does not repeat an untried action that is already awaiting data', () => {
        const inProgress = ev({ actionId: 'dim-light', decision: 'approved', decidedAt: 0, recoveryStatus: 'pending' });
        expect(chooseAction([inProgress])).toBe('calm-audio');
    });
    it('rotates past an action the caregiver declined', () => {
        const declined = ev({ actionId: 'dim-light', decision: 'not-now', decidedAt: 1 });
        expect(chooseAction([declined])).toBe('calm-audio');
    });
    it('ranks by lowest average recovery time once all have data', () => {
        const events = [done('dim-light', 300), done('calm-audio', 100), done('haptic', 200), done('calm-audio', 140)];
        expect(rankActions(computeStats(events))).toEqual(['calm-audio', 'haptic', 'dim-light']);
        expect(chooseAction(events)).toBe('calm-audio');
    });
    it('counts "not recovered" as the 15 minute cap', () => {
        const s = computeStats([done('dim-light', null), done('dim-light', 100)]);
        expect(s['dim-light'].avgRecoverySec).toBe((900 + 100) / 2);
        expect(s['dim-light'].notRecovered).toBe(1);
    });
});

describe('csv', () => {
    it('exports a header and one escaped row per event', () => {
        const e = ev({ actionId: 'calm-audio', decision: 'approved', decidedAt: 5, executed: false, execError: 'file, "missing"', recoveryStatus: 'pending' });
        const lines = eventsToCsv([e], 'live').trim().split('\r\n');
        expect(lines[0]).toMatch(/^time_iso,data_mode,state/);
        expect(lines).toHaveLength(2);
        expect(lines[1]).toContain('"no: file, ""missing"""');
        expect(lines[1]).toContain(',live,Escalating,');
    });
});
