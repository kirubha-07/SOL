import React, { useState } from 'react';
import { useDemoMode } from '../data/demoContext';
import { useVitals } from '../data/useVitals';
import { isMuted, statusLabel } from '../data/useDisplayState';
import { useNow, formatAge } from '../data/useNow';
import { Watch, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export const Wearable: React.FC = () => {
    const { dataMode } = useDemoMode();
    const vitals = useVitals();
    const now = useNow();
    const demo = dataMode === 'demo';
    const muted = isMuted(vitals);
    const live = vitals.status === 'live';
    const [msg, setMsg] = useState<string | null>(null);

    const send = async (value: 0 | 1) => {
        setMsg(null);
        try {
            await vitals.sendCommand('v3', value);
            setMsg(value ? 'Start command sent to the band.' : 'Stop command sent to the band.');
        } catch (e) {
            setMsg(`Could not send: ${e instanceof Error ? e.message : 'unknown error'}`);
        }
    };

    const devices = [
        { name: 'MAX30102', type: 'Heart rate / SpO2 sensor', ok: !muted && vitals.hrValid, note: muted ? 'No data' : vitals.hrValid ? 'Finger detected' : 'No finger detected' },
        { name: 'MPU6050', type: 'Motion sensor', ok: !muted && vitals.motion !== null, note: muted ? 'No data' : vitals.motion !== null ? 'Reporting motion' : 'No motion value received' },
        { name: 'ESP32', type: 'Processor · Wi-Fi to Blynk', ok: live || demo, note: demo ? 'Simulated' : vitals.connected ? 'Online in Blynk' : 'Offline in Blynk' },
    ];

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Wearable Status</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Connection and sensor status{demo ? ' (simulated in Demo mode)' : ''}.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white border border-[#E8E0D5] p-8 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 rounded-full bg-black/5 flex items-center justify-center mb-6">
                        <Watch className="w-16 h-16 text-[#2A2118] opacity-80" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#2A2118] mb-1">SOL Band</h2>
                    <p className="text-sm text-[#7A7A52] mb-6">ESP32 • Wi-Fi via Blynk</p>

                    <span className={clsx(
                        "px-3 py-1 font-semibold text-xs tracking-wider uppercase rounded-full border",
                        live ? "bg-(--color-calm)/10 text-(--color-calm) border-(--color-calm)/20" : demo ? "bg-(--color-elevated)/15 text-[#7A5A10] border-(--color-elevated)/30" : "bg-black/5 text-[#7A7A52] border-[#E8E0D5]"
                    )}>
                        {statusLabel(vitals)}
                    </span>
                    <p className="text-xs text-[#7A7A52] mt-4">
                        {vitals.lastUpdated
                            ? `Last update: ${new Date(vitals.lastUpdated).toLocaleTimeString()} (${formatAge(now - vitals.lastUpdated)})`
                            : vitals.loading ? 'Connecting…' : 'No data received yet'}
                    </p>
                    {vitals.error && !demo && <p className="text-xs text-(--color-escalating) mt-2">Service error: {vitals.error}</p>}

                    {!demo && (
                        <div className="mt-6 flex flex-col gap-2 w-full">
                            <div className="flex gap-2">
                                <button onClick={() => send(1)} className="flex-1 py-2 rounded-xl bg-[#1C1815] text-white text-sm font-semibold hover:bg-black">Start sending</button>
                                <button onClick={() => send(0)} className="flex-1 py-2 rounded-xl bg-black/5 text-[#2A2118] text-sm font-semibold hover:bg-black/10">Stop</button>
                            </div>
                            {msg && <p className="text-xs text-[#7A7A52]">{msg}</p>}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 content-start">
                    {devices.map(d => (
                        <div key={d.name} className="bg-white border border-[#E8E0D5] p-6 rounded-2xl flex flex-col shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">{d.type}</span>
                                    <span className="font-serif font-bold text-xl text-[#2A2118]">{d.name}</span>
                                </div>
                                <div className={clsx("w-2 h-2 rounded-full mt-2", d.ok ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-[#C9C0B3]")} />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#7A7A52] mt-auto">
                                <RefreshCw className="w-3 h-3" /> {d.note}
                            </div>
                        </div>
                    ))}
                    <p className="md:col-span-3 text-xs text-[#7A7A52]">
                        Battery level is not reported by the band, so none is shown. “Disconnected” means Blynk reports the band offline, or no new values arrived for 15 seconds.
                    </p>
                </div>
            </div>
        </div>
    );
};
