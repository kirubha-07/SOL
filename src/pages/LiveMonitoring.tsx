import React from 'react';
import { useDemoMode } from '../data/demoContext';
import { useVitals } from '../data/useVitals';
import { useSolState } from '../data/useSolState';
import { readingText, isMuted, statusLabel } from '../data/useDisplayState';
import { useNow, formatAge } from '../data/useNow';
import { WaveformChart } from '../components/WaveformChart';
import { StatCard } from '../components/StatCard';
import { Activity, Heart, Droplets, Wifi } from 'lucide-react';
import clsx from 'clsx';

export const LiveMonitoring: React.FC = () => {
    const { dataMode } = useDemoMode();
    const vitals = useVitals();
    const sol = useSolState();
    const now = useNow();
    const muted = isMuted(vitals);
    const hr = readingText(vitals, 'hr');
    const spo2 = readingText(vitals, 'spo2');
    const motion = readingText(vitals, 'motion');
    const gateOn = vitals.motion !== null && vitals.motion > sol.config.motionThreshold;
    const demo = dataMode === 'demo';

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Live Monitoring</h1>
                <p className="text-[#7A7A52] text-sm mt-2">
                    Latest values from the band{demo ? ' (simulated in Demo mode)' : ''}. Values turn grey when the band has not reported for 15 seconds.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1C1815] text-white rounded-3xl p-8 flex flex-col shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs uppercase tracking-widest text-[#E8E0D5] font-semibold">Heart Rate</span>
                            <span className="text-sm text-[#E8E0D5]/70">MAX30102{demo ? ' • simulated' : ''}</span>
                        </div>
                        <Heart className="w-6 h-6 text-(--color-terracotta)" />
                    </div>

                    <div className={clsx("font-serif leading-none tracking-tight mb-8", hr.words ? "text-4xl" : "text-8xl", muted && "opacity-40")}>
                        {hr.text} {!hr.words && hr.text !== '—' && <span className="text-2xl text-[#E8E0D5]/70">bpm</span>}
                    </div>

                    <WaveformChart dark height={140} />
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 shadow-sm flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Movement</span>
                                <span className="text-sm text-[#7A7A52]">MPU6050 • deviation from 1 g{demo ? ' • simulated' : ''}</span>
                            </div>
                            <Activity className="w-6 h-6 text-[#2A2118]" />
                        </div>

                        <div className={clsx("text-8xl font-serif leading-none tracking-tight mb-2 text-[#2A2118]", muted && "opacity-40")}>
                            {motion.text} {motion.text !== '—' && <span className="text-2xl text-[#7A7A52]">g</span>}
                        </div>

                        <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#E8E0D5]">
                            <span className="text-sm font-medium">Motion gate (limit {sol.config.motionThreshold} g)</span>
                            <div className="text-[#2A2118] font-mono text-sm font-bold bg-black/5 px-2 py-1 rounded">
                                {vitals.motion === null || muted ? '—' : gateOn ? 'ON · counted as exercise' : 'off'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            label="SpO2"
                            subValue={demo ? 'MAX30102 · simulated' : 'MAX30102'}
                            value={spo2.text}
                            unit={spo2.words || spo2.text === '—' ? undefined : '%'}
                            muted={muted}
                            icon={<Droplets className="w-5 h-5" />}
                        />
                        <StatCard
                            label="Band"
                            subValue={vitals.lastUpdated ? `Updated ${formatAge(now - vitals.lastUpdated)}` : 'No data yet'}
                            value={statusLabel(vitals)}
                            icon={<Wifi className="w-5 h-5" />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
