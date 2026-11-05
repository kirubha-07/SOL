import type { SensoryState } from './types';
import { useDemoMode } from './demoContext';
import { useVitals, type Vitals } from './useVitals';
import { useSolState } from './useSolState';

export type Tone = 'calm' | 'elevated' | 'escalating' | 'muted';

export interface DisplayState {
    /** What to show in place of the state name. */
    label: string;
    tone: Tone;
    /** The real reported state when one should drive actions/logic, else null. */
    state: SensoryState | null;
    hint: string | null;
    /** True when the band is not delivering fresh data (values must be greyed out). */
    muted: boolean;
}

export const readingText = (v: Vitals, kind: 'hr' | 'spo2' | 'motion'): { text: string; words: boolean } => {
    if (v.lastUpdated === null) return { text: '—', words: false };
    if (kind === 'motion') return v.motion === null ? { text: '—', words: false } : { text: v.motion.toFixed(2), words: false };
    const valid = kind === 'hr' ? v.hrValid : v.spo2Valid;
    if (!valid) return { text: 'No finger detected', words: true };
    return { text: String(Math.round((kind === 'hr' ? v.hr : v.spo2) as number)), words: false };
};

export const isMuted = (v: Vitals) => v.status === 'stale' || v.status === 'disconnected';

export const statusLabel = (v: Vitals) => (v.status === 'live' ? 'Live' : v.status === 'demo' ? 'Demo' : 'Disconnected');

/** One place that decides what the caregiver sees as "the state", so every screen agrees. */
export function useDisplayState(): DisplayState {
    const { dataMode } = useDemoMode();
    const vitals = useVitals();
    const sol = useSolState();
    const toneOf = (s: SensoryState): Tone => (s === 'Calm' ? 'calm' : s === 'Elevated' ? 'elevated' : 'escalating');

    if (dataMode === 'demo') {
        return { label: sol.state ?? '—', tone: sol.state ? toneOf(sol.state) : 'muted', state: sol.state, hint: 'Simulated (Demo mode)', muted: false };
    }
    if (isMuted(vitals)) {
        return { label: 'Disconnected', tone: 'muted', state: null, hint: vitals.error ? `Cannot reach the band service: ${vitals.error}` : 'No fresh data from the band.', muted: true };
    }
    if (sol.calibrating) {
        return { label: 'Calibrating', tone: 'muted', state: null, hint: `Resting baseline: ${sol.calibrating.collected}/${sol.calibrating.target} windows (30 s each)`, muted: false };
    }
    if (!sol.baseline) {
        return { label: 'Baseline needed', tone: 'muted', state: null, hint: 'Record a 5-minute resting baseline in Settings.', muted: false };
    }
    if (!vitals.hrValid) {
        return { label: 'No finger detected', tone: 'muted', state: null, hint: 'Place a finger on the sensor.', muted: false };
    }
    if (sol.state === null) {
        return { label: 'Waiting for data', tone: 'muted', state: null, hint: 'The first 30 s window is not complete yet.', muted: false };
    }
    return { label: sol.state, tone: toneOf(sol.state), state: sol.state, hint: null, muted: false };
}

export const toneClass: Record<Tone, string> = {
    calm: 'text-(--color-calm)',
    elevated: 'text-(--color-elevated)',
    escalating: 'text-(--color-escalating)',
    muted: 'text-[#7A7A52]',
};
