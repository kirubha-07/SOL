import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { HeartPulse } from 'lucide-react';
import clsx from 'clsx';
import { useVitals, HISTORY_MS } from '../data/useVitals';
import { useDemoMode } from '../data/demoContext';
import { isMuted } from '../data/useDisplayState';

/** Rolling line of the last 5 minutes of real heart-rate samples (simulated in Demo mode). */
export const WaveformChart: React.FC<{ dark?: boolean; height?: number }> = ({ dark = false, height = 120 }) => {
    const vitals = useVitals();
    const { dataMode } = useDemoMode();
    const muted = isMuted(vitals);
    const data = vitals.history.filter((s) => s.hr !== null && s.hr > 0).map((s) => ({ t: s.t, hr: s.hr as number }));
    const end = vitals.lastUpdated ?? 0;

    return (
        <div className="w-full relative flex flex-col h-full rounded-2xl overflow-hidden p-6 bg-[#161210]">
            <div className="flex justify-between items-center mb-6 z-10 relative">
                <h3 className={clsx("text-xs font-semibold uppercase tracking-widest", dark ? "text-[#E8E0D5]" : "text-[#7A7A52]")}>
                    Heart rate · last 5 min{dataMode === 'demo' ? ' · simulated' : ''}
                </h3>
                <HeartPulse className={clsx("w-5 h-5", muted ? "text-[#7A7A52]" : "text-(--color-terracotta)")} />
            </div>

            <div className="relative flex-1 mt-auto z-0" style={{ minHeight: height, height }}>
                {data.length < 2 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-[#E8E0D5]/60">
                        {muted ? 'Disconnected' : vitals.lastUpdated !== null && !vitals.hrValid ? 'No finger detected' : 'Collecting samples…'}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                            <XAxis dataKey="t" type="number" domain={[end - HISTORY_MS, end]} hide />
                            <YAxis hide domain={['dataMin - 8', 'dataMax + 8']} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', background: '#1C1815', color: '#FAF6F0', fontSize: 12 }}
                                labelFormatter={(t) => new Date(Number(t)).toLocaleTimeString()}
                                formatter={(v) => [`${v} bpm`, 'Heart rate']}
                            />
                            <Line type="monotone" dataKey="hr" stroke={muted ? '#7A7A52' : '#C1633D'} strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none rounded-2xl z-20"></div>
        </div>
    );
};
