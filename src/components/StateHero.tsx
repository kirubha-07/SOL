import React, { useState } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { useVitals } from '../data/useVitals';
import { useSolState } from '../data/useSolState';
import { useDisplayState, toneClass } from '../data/useDisplayState';
import { Info, X } from 'lucide-react';

const fmt = (n: number | null | undefined, d = 1) => (n === null || n === undefined ? '—' : n.toFixed(d));

export const StateHero: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const display = useDisplayState();
    const vitals = useVitals();
    const sol = useSolState();
    const w = sol.lastWindow;
    const gateOn = vitals.motion !== null && vitals.motion > sol.config.motionThreshold;

    return (
        <>
            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-[#E8E0D5] relative flex flex-col items-center justify-center text-center">
                <h2 className="text-[#7A7A52] text-sm uppercase tracking-[0.2em] font-semibold mb-4">Current Sensory State</h2>
                <div className={clsx("font-serif leading-none tracking-tight mb-6", display.label.length > 12 ? "text-4xl lg:text-6xl" : "text-7xl lg:text-9xl", toneClass[display.tone])}>
                    {display.label}
                </div>
                {display.hint && (
                    <p className="text-sm text-[#7A7A52] mb-6 max-w-sm">
                        {display.hint}
                        {display.label === 'Baseline needed' && <> <Link to="/settings" className="text-(--color-terracotta) font-semibold underline">Open Settings</Link></>}
                    </p>
                )}

                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black/[0.03] hover:bg-black/[0.06] rounded-full transition-colors transition-transform active:scale-95"
                >
                    <Info className="w-4 h-4 text-[#2A2118]" />
                    <span className="text-sm font-medium text-[#2A2118]">Why this status?</span>
                </button>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#1C1815]/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setModalOpen(false)}
                            aria-label="Close"
                            className="absolute top-6 right-6 p-2 bg-black/[0.03] hover:bg-black/[0.1] rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-serif font-bold text-[#2A2118] mb-2">How this was decided</h3>
                        <p className="text-[#7A7A52] text-xs uppercase tracking-widest font-semibold mb-6">
                            Rule-based{sol.isDemo ? ' · simulated (Demo)' : ''}
                        </p>

                        {sol.baseline && sol.thresholds ? (
                            <dl className="space-y-3 text-sm text-[#2A2118]">
                                <Row k="Last 30 s window (mean heart rate)" v={w ? `${fmt(w.meanHr, 0)} bpm` : '—'} />
                                <Row k="Resting baseline" v={`${fmt(sol.baseline.meanHr, 0)} bpm ± ${fmt(sol.baseline.sdHr)}`} />
                                <Row k={`Elevated above (mean + ${sol.config.elevatedMultiplier}×SD)`} v={`${fmt(sol.thresholds.elevatedAt, 0)} bpm`} />
                                <Row k={`Escalating above (mean + ${sol.config.escalatingMultiplier}×SD)`} v={`${fmt(sol.thresholds.escalatingAt, 0)} bpm`} />
                                <Row k={`Motion gate (limit ${sol.config.motionThreshold} g)`} v={gateOn ? 'ON · treated as exercise' : 'off'} />
                                <Row k="Windows persisted" v={`${sol.persistence.streak}/${sol.persistence.required}${sol.persistence.candidate ? ` toward ${sol.persistence.candidate}` : ''}`} />
                            </dl>
                        ) : (
                            <p className="text-sm text-[#2A2118]/80">No resting baseline yet, so no state can be decided. Record one in Settings.</p>
                        )}

                        <div className="mt-8 pt-6 border-t border-[#E8E0D5] flex items-center justify-between opacity-70">
                            <span className="text-xs font-medium">Monitoring and support only</span>
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-black/5 rounded">Rules, not a trained model</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
    <div className="flex justify-between gap-4 border-b border-[#E8E0D5]/60 pb-2 last:border-0">
        <dt className="text-[#7A7A52]">{k}</dt>
        <dd className="font-semibold text-right">{v}</dd>
    </div>
);
