import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON } from './localStore';
import { MOTION_EXERCISE_THRESHOLD, PERSISTENCE_WINDOWS } from './stateEngine';

export interface Settings {
    motionThreshold: number;
    persistenceWindows: number;
    /** Optional local light bridge, e.g. http://localhost:8787. Empty = simulated bulb. */
    bridgeUrl: string;
    childName: string;
}

export const DEFAULT_SETTINGS: Settings = {
    motionThreshold: MOTION_EXERCISE_THRESHOLD,
    persistenceWindows: PERSISTENCE_WINDOWS,
    bridgeUrl: '',
    childName: 'Child 1',
};

let current: Settings = { ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>('settings', {}) };
const listeners = new Set<() => void>();

export const getSettings = () => current;

export function updateSettings(patch: Partial<Settings>): void {
    current = { ...current, ...patch };
    writeJSON('settings', current);
    listeners.forEach((l) => l());
}

export function useSettings(): Settings {
    return useSyncExternalStore(
        (cb) => {
            listeners.add(cb);
            return () => listeners.delete(cb);
        },
        getSettings
    );
}
