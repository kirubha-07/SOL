import { createContext } from 'react';
import type { ActionId, ActionStat, SolEvent } from './eventLog';
import type { SolAction } from './actions';

export interface ApprovalValue {
    mode: 'live' | 'demo';
    /** Newest first. Live and Demo logs are kept separately. */
    events: SolEvent[];
    /** The Escalating suggestion waiting for a caregiver decision, if any. */
    pending: SolEvent | null;
    /** An approved action whose recovery time is still being measured. */
    tracking: SolEvent | null;
    stats: Record<ActionId, ActionStat>;
    ranking: ActionId[];
    /** What would be suggested next. */
    nextAction: ActionId;
    actions: Record<ActionId, SolAction>;
    approve: () => void;
    notNow: () => void;
    lastResult: { message: string; ok: boolean } | null;
    clearResult: () => void;
}

export const ApprovalContext = createContext<ApprovalValue | null>(null);
