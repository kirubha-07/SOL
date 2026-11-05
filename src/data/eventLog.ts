// Pure helpers for the caregiver-approval flow: event log, expiry, recovery timing, ranking and CSV export.
import type { SensoryState } from './types';

export type ActionId = 'dim-light' | 'calm-audio' | 'haptic';
/** Order used when no data separates two actions. */
export const ACTION_ORDER: ActionId[] = ['dim-light', 'calm-audio', 'haptic'];
export const APPROVAL_TIMEOUT_MS = 120_000;
export const RECOVERY_GIVE_UP_MS = 15 * 60_000;
export const MAX_EVENTS = 1000;

export type Decision = 'approved' | 'not-now' | 'expired';
export type RecoveryStatus = 'pending' | 'recovered' | 'not-recovered' | 'unknown';

export interface EventTrigger {
    hr: number | null;
    baselineMean: number | null;
    baselineSd: number | null;
    elevatedAt: number | null;
    escalatingAt: number | null;
    motion: number | null;
    motionThreshold: number;
}

export interface SolEvent {
    id: string;
    t: number;
    state: 'Elevated' | 'Escalating';
    trigger: EventTrigger;
    /** Only Escalating events carry a suggestion. */
    actionId: ActionId | null;
    expiresAt: number | null;
    decision: Decision | null;
    decidedAt: number | null;
    note: string | null;
    /** Did the approved action actually run? null = not applicable / not finished. */
    executed: boolean | null;
    execError: string | null;
    recoveryStatus: RecoveryStatus | null;
    recoverySec: number | null;
}

export function newEvent(args: { id: string; t: number; state: 'Elevated' | 'Escalating'; trigger: EventTrigger; actionId: ActionId | null }): SolEvent {
    return {
        id: args.id, t: args.t, state: args.state, trigger: args.trigger, actionId: args.actionId,
        expiresAt: args.actionId ? args.t + APPROVAL_TIMEOUT_MS : null,
        decision: null, decidedAt: null, note: args.actionId ? null : 'Quiet note only: no action suggested at this level',
        executed: null, execError: null, recoveryStatus: null, recoverySec: null,
    };
}

export const isPending = (e: SolEvent) => e.actionId !== null && e.decision === null;

/**
 * Expire a suggestion that got no answer in time, or whose Escalating state ended before an answer.
 * Returns the same array reference when nothing changed.
 */
export function expirePending(events: SolEvent[], now: number, currentState: SensoryState | null): SolEvent[] {
    let changed = false;
    const next = events.map((e) => {
        if (!isPending(e)) return e;
        if (e.expiresAt !== null && now >= e.expiresAt) {
            changed = true;
            return { ...e, decision: 'expired' as const, decidedAt: now, note: 'No response within 120 s: expired, no action' };
        }
        if (currentState !== null && currentState !== 'Escalating') {
            changed = true;
            return { ...e, decision: 'expired' as const, decidedAt: now, note: 'State changed before a response: expired, no action' };
        }
        return e;
    });
    return changed ? next : events;
}

/**
 * Close recovery timers. `cur.since` is when the reported state last changed.
 * Recovery = seconds from Approve until the reported state returned to Calm; after 15 min -> "not recovered".
 */
export function resolveRecoveries(events: SolEvent[], now: number, cur: { state: SensoryState | null; since: number }): SolEvent[] {
    let changed = false;
    const next = events.map((e) => {
        if (e.recoveryStatus !== 'pending' || e.decidedAt === null) return e;
        const calmAt = cur.state === 'Calm' && cur.since >= e.decidedAt ? cur.since : null;
        if (calmAt !== null && calmAt - e.decidedAt < RECOVERY_GIVE_UP_MS) {
            changed = true;
            return { ...e, recoveryStatus: 'recovered' as const, recoverySec: Math.round((calmAt - e.decidedAt) / 1000) };
        }
        if (now - e.decidedAt >= RECOVERY_GIVE_UP_MS) {
            changed = true;
            return { ...e, recoveryStatus: 'not-recovered' as const, recoverySec: null };
        }
        return e;
    });
    return changed ? next : events;
}

/** On app start: a recovery that was already past its deadline was not watched, so it counts for nothing. */
export function closeStaleRecoveries(events: SolEvent[], now: number): SolEvent[] {
    let changed = false;
    const next = events.map((e) => {
        if (e.recoveryStatus === 'pending' && e.decidedAt !== null && now - e.decidedAt >= RECOVERY_GIVE_UP_MS) {
            changed = true;
            return { ...e, recoveryStatus: 'unknown' as const, note: (e.note ? e.note + '; ' : '') + 'app was closed, recovery not measured' };
        }
        return e;
    });
    return changed ? next : events;
}

export interface ActionStat {
    id: ActionId;
    suggested: number;
    approved: number;
    recovered: number;
    notRecovered: number;
    pending: number;
    /** Number of finished trials (recovered + not recovered). */
    trials: number;
    /** Mean seconds to Calm. A "not recovered" trial counts as the 15-minute cap. */
    avgRecoverySec: number | null;
}

export function computeStats(events: SolEvent[]): Record<ActionId, ActionStat> {
    const out = {} as Record<ActionId, ActionStat>;
    for (const id of ACTION_ORDER) {
        const mine = events.filter((e) => e.actionId === id);
        const done = mine.filter((e) => e.recoveryStatus === 'recovered' || e.recoveryStatus === 'not-recovered');
        const secs = done.map((e) => (e.recoveryStatus === 'recovered' ? (e.recoverySec as number) : RECOVERY_GIVE_UP_MS / 1000));
        out[id] = {
            id,
            suggested: mine.length,
            approved: mine.filter((e) => e.decision === 'approved').length,
            recovered: done.filter((e) => e.recoveryStatus === 'recovered').length,
            notRecovered: done.filter((e) => e.recoveryStatus === 'not-recovered').length,
            pending: mine.filter((e) => e.recoveryStatus === 'pending').length,
            trials: done.length,
            avgRecoverySec: secs.length ? secs.reduce((a, b) => a + b, 0) / secs.length : null,
        };
    }
    return out;
}

/** Actions with data, best (lowest average recovery) first; actions without data follow in default order. */
export function rankActions(stats: Record<ActionId, ActionStat>): ActionId[] {
    const withData = ACTION_ORDER.filter((id) => stats[id].trials > 0).sort(
        (a, b) => (stats[a].avgRecoverySec as number) - (stats[b].avgRecoverySec as number)
    );
    return [...withData, ...ACTION_ORDER.filter((id) => stats[id].trials === 0)];
}

/**
 * Next action to suggest. Actions with no data (no finished trial and none in progress) come first,
 * each tried before any ranking applies (least-suggested first, so a declined one doesn't block the others).
 * After that, the one with the lowest average recovery time.
 */
export function chooseAction(events: SolEvent[]): ActionId {
    const stats = computeStats(events);
    const untried = ACTION_ORDER.filter((id) => stats[id].trials === 0 && stats[id].pending === 0);
    if (untried.length) {
        return [...untried].sort((a, b) => stats[a].suggested - stats[b].suggested || ACTION_ORDER.indexOf(a) - ACTION_ORDER.indexOf(b))[0];
    }
    return rankActions(stats)[0];
}

const csvCell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_HEADER = [
    'time_iso', 'data_mode', 'state', 'window_hr_bpm', 'baseline_mean_bpm', 'baseline_sd', 'elevated_above_bpm', 'escalating_above_bpm',
    'motion_g', 'motion_limit_g', 'action_suggested', 'decision', 'decided_at_iso', 'action_ran', 'recovery_status', 'recovery_seconds', 'note',
];

export function eventsToCsv(events: SolEvent[], mode: 'live' | 'demo'): string {
    const r = (n: number | null, d = 1) => (n === null ? '' : n.toFixed(d));
    const rows = events.map((e) => [
        new Date(e.t).toISOString(), mode, e.state, r(e.trigger.hr), r(e.trigger.baselineMean), r(e.trigger.baselineSd), r(e.trigger.elevatedAt), r(e.trigger.escalatingAt),
        r(e.trigger.motion, 2), e.trigger.motionThreshold, e.actionId ?? '', e.decision ?? (e.actionId ? 'pending' : ''), e.decidedAt ? new Date(e.decidedAt).toISOString() : '',
        e.executed === null ? '' : e.executed ? 'yes' : `no${e.execError ? ': ' + e.execError : ''}`, e.recoveryStatus ?? '', e.recoverySec ?? '', e.note ?? '',
    ]);
    return [CSV_HEADER, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
