// Support actions the caregiver can approve. Nothing here runs until an Approve button press calls run().
import { useSyncExternalStore } from 'react';
import type { ActionId } from './eventLog';

export interface SolAction {
    id: ActionId;
    label: string;
    /** The one-line question shown to the caregiver. */
    prompt: string;
    description: string;
    run(): Promise<void>;
    /** Undo / stop (restore the light, stop the audio). */
    stop(): Promise<void>;
}

export interface LightController {
    dim(): Promise<void>;
    restore(): Promise<void>;
}

// ---------- on-screen status (shared by Environment page and the alert card) ----------
export interface ActionStatus {
    bulb: 'normal' | 'dimmed';
    bulbDriver: 'simulated' | 'bridge';
    audio: 'stopped' | 'playing';
    hapticLastAt: number | null;
    hapticDemo: boolean;
}
let status: ActionStatus = { bulb: 'normal', bulbDriver: 'simulated', audio: 'stopped', hapticLastAt: null, hapticDemo: false };
const subs = new Set<() => void>();
const setStatus = (patch: Partial<ActionStatus>) => {
    status = { ...status, ...patch };
    subs.forEach((s) => s());
};
export function useActionStatus(): ActionStatus {
    return useSyncExternalStore(
        (cb) => {
            subs.add(cb);
            return () => subs.delete(cb);
        },
        () => status
    );
}

// ---------- light ----------
/** Default. Only updates the on-screen "Bulb: dimmed" indicator. Controls no real bulb. */
export function createSimulatedLight(): LightController {
    return {
        async dim() {
            setStatus({ bulb: 'dimmed', bulbDriver: 'simulated' });
        },
        async restore() {
            setStatus({ bulb: 'normal', bulbDriver: 'simulated' });
        },
    };
}

/** POSTs to the optional local bridge (see /bridge). UNTESTED against a real bulb. */
export function createHttpLight(baseUrl: string): LightController {
    const base = baseUrl.replace(/\/+$/, '');
    const post = async (path: string) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        try {
            const r = await fetch(`${base}${path}`, { method: 'POST', signal: ctrl.signal });
            if (!r.ok) throw new Error(`Light bridge answered ${r.status}`);
        } catch (e) {
            throw new Error(e instanceof Error && e.name === 'AbortError' ? 'Light bridge did not answer in time' : e instanceof Error ? e.message : 'Light bridge unreachable');
        } finally {
            clearTimeout(timer);
        }
    };
    return {
        async dim() {
            await post('/dim');
            setStatus({ bulb: 'dimmed', bulbDriver: 'bridge' });
        },
        async restore() {
            await post('/restore');
            setStatus({ bulb: 'normal', bulbDriver: 'bridge' });
        },
    };
}

// ---------- audio ----------
// TODO: add a royalty-free, looping calming audio file at public/audio/calm.mp3 (see public/audio/README.md).
// Until then, approving "Play calming audio" reports "audio file missing" and nothing plays.
export const CALM_AUDIO_SRC = '/audio/calm.mp3';
let audio: HTMLAudioElement | null = null;

async function playCalmAudio(): Promise<void> {
    if (!audio) {
        audio = new Audio(CALM_AUDIO_SRC);
        audio.loop = true;
    }
    try {
        // Must be reached synchronously from the Approve click so the browser allows playback.
        await audio.play();
        setStatus({ audio: 'playing' });
    } catch {
        audio = null;
        setStatus({ audio: 'stopped' });
        throw new Error('Calming audio could not play. Add a file at public/audio/calm.mp3 (see public/audio/README.md).');
    }
}

async function stopCalmAudio(): Promise<void> {
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
    setStatus({ audio: 'stopped' });
}

// ---------- actions ----------
export interface ActionDeps {
    isDemo(): boolean;
    bridgeUrl(): string;
    sendCommand(pin: 'v3' | 'v5', value: 0 | 1): Promise<void>;
}

export function buildActions(deps: ActionDeps): Record<ActionId, SolAction> {
    const light = (): LightController => (deps.isDemo() || !deps.bridgeUrl().trim() ? createSimulatedLight() : createHttpLight(deps.bridgeUrl().trim()));
    return {
        'dim-light': {
            id: 'dim-light',
            label: 'Dim the light',
            prompt: 'Dim the light?',
            description: 'Lowers the room light to reduce visual input.',
            run: () => light().dim(),
            stop: () => light().restore(),
        },
        'calm-audio': {
            id: 'calm-audio',
            label: 'Play calming audio',
            prompt: 'Play calming audio?',
            description: 'Plays a quiet, looping calming sound on this device.',
            run: playCalmAudio,
            stop: stopCalmAudio,
        },
        haptic: {
            id: 'haptic',
            label: 'Gentle band vibration',
            prompt: 'Send a gentle vibration to the band?',
            description: 'The band vibrates for about 2 seconds.',
            async run() {
                if (deps.isDemo()) {
                    setStatus({ hapticLastAt: Date.now(), hapticDemo: true });
                    return; // Demo: simulated, nothing is sent.
                }
                await deps.sendCommand('v5', 1);
                setStatus({ hapticLastAt: Date.now(), hapticDemo: false });
            },
            async stop() {},
        },
    };
}
