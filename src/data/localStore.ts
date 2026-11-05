// Thin localStorage wrapper. Everything SOL stores lives under the "sol." prefix and stays on this device.
const PREFIX = 'sol.';

export function readJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

export function writeJSON(key: string, value: unknown): void {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        // Storage full or unavailable (private mode): the app keeps working in memory.
    }
}

export function removeKey(key: string): void {
    try {
        localStorage.removeItem(PREFIX + key);
    } catch {
        // ignore
    }
}

/** Remove every key SOL has written on this device. */
export function clearAllLocalData(): void {
    try {
        Object.keys(localStorage)
            .filter((k) => k.startsWith(PREFIX))
            .forEach((k) => localStorage.removeItem(k));
    } catch {
        // ignore
    }
}
