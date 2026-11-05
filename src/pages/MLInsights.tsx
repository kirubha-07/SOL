import React from 'react';
import { Link } from 'react-router-dom';
import { useVitals } from '../data/useVitals';
import { useSolState } from '../data/useSolState';
import { useDisplayState, toneClass, isMuted } from '../data/useDisplayState';
import { BrainCircuit, Info } from 'lucide-react';
import clsx from 'clsx';

const fmt = (n: number | null | undefined, d = 0) => (n === null || n === undefined ? '—' : n.toFixed(d));

export const MLInsights: React.FC = () => {
    const vitals = useVitals();
    const sol = useSolState();
    const display = useDisplayState();
    const { baseline, thresholds, lastWindow, config, persistence } = sol;
    const muted = isMuted(vitals);
    const gateOn = vitals.motion !== null && vitals.motion > config.motionThreshold;

    // Where the most recent window sits relative to the baseline band (0-100% of the bar).
    const hi = thresholds ? thresholds.escalatingAt + (thresholds.escalatingAt - thresholds.elevatedAt) : 0;
    const lo = baseline ? baseline.meanHr - (hi - baseline.meanHr) / 2 : 0;
    const pos = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Rule-based detection (model training pending)</h1>
                <div className="flex items-center gap-2 text-[#7A7A52] text-sm mt-2">
                    <span className="uppercase tracking-widest font-semibold text-xs border border-[#E8E0D5] px-2 py-1 rounded">{sol.isDemo ? 'Demo' : 'Rules'}</span>
                    <span>The values below are the actual rule inputs and outputs. No trained model and no confidence scores are used yet.</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1C1815] text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-[#E8E0D5]/70 font-semibold mb-6">Reported State</h3>
                        <div className={clsx("font-serif leading-none tracking-tight mb-4", display.label.length > 12 ? "text-3xl" : "text-5xl", display.tone === 'muted' ? 'text-[#E8E0D5]/60' : toneClass[display.tone])}>
                            {display.label}
                        </div>
                        <p className="text-[#E8E0D5]/80 text-sm leading-relaxed">{display.hint ?? 'Decided from the last 30-second windows against this child\'s resting baseline.'}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                        <span className="text-sm font-medium">Windows persisted</span>
                        <span className="text-2xl font-serif">{persistence.streak}/{persistence.required}</span>
                    </div>
                </div>

                <div className="bg-white border border-[#E8E0D5] p-8 rounded-3xl shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Heart rate vs baseline</h3>
                        <BrainCircuit className="w-5 h-5 text-[#7A7A52]" />
                    </div>
                    {baseline && thresholds ? (
                        <>
                            <div className="relative h-4 rounded-full overflow-hidden flex">
                                <div className="bg-(--color-calm)/40" style={{ width: `${pos(thresholds.elevatedAt)}%` }} />
                                <div className="bg-(--color-elevated)/50" style={{ width: `${pos(thresholds.escalatingAt) - pos(thresholds.elevatedAt)}%` }} />
                                <div className="bg-(--color-escalating)/50 flex-1" />
                                {lastWindow?.meanHr != null && (
                                    <div className={clsx("absolute top-0 bottom-0 w-1 bg-[#1C1815]", muted && "opacity-30")} style={{ left: `${pos(lastWindow.meanHr)}%` }} />
                                )}
                            </div>
                            <dl className="text-sm space-y-2 text-[#2A2118]">
                                <Line k="Last window (mean)" v={`${fmt(lastWindow?.meanHr)} bpm`} />
                                <Line k="Now" v={vitals.hrValid ? `${fmt(vitals.hr)} bpm` : 'No finger detected'} />
                                <Line k="Resting baseline" v={`${fmt(baseline.meanHr)} bpm ± ${fmt(baseline.sdHr, 1)}${baseline.quick ? ' (quick calibration)' : ''}`} />
                                <Line k={`Elevated above (mean + ${config.elevatedMultiplier}×SD)`} v={`${fmt(thresholds.elevatedAt)} bpm`} />
                                <Line k={`Escalating above (mean + ${config.escalatingMultiplier}×SD)`} v={`${fmt(thresholds.escalatingAt)} bpm`} />
                            </dl>
                        </>
                    ) : (
                        <p className="text-sm text-[#7A7A52]">
                            No resting baseline yet. <Link to="/settings" className="text-(--color-terracotta) font-semibold underline">Record one in Settings.</Link>
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E8E0D5] p-8 rounded-3xl shadow-sm">
                    <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold mb-4">Motion gate</h3>
                    <div className="font-serif text-4xl text-[#2A2118] mb-2">{vitals.motion === null || muted ? '—' : gateOn ? 'ON' : 'off'}</div>
                    <p className="text-sm text-[#7A7A52] leading-relaxed">
                        Motion now: {fmt(vitals.motion, 2)} g. Limit: {config.motionThreshold} g. A window above the limit is counted as exercise and cannot be Elevated or Escalating.
                    </p>
                </div>
                <div className="bg-white border border-[#E8E0D5] p-8 rounded-3xl shadow-sm">
                    <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold mb-4">Last 30-second window</h3>
                    <div className="font-serif text-4xl text-[#2A2118] mb-2">{lastWindow?.label ?? '—'}</div>
                    <p className="text-sm text-[#7A7A52] leading-relaxed">
                        {lastWindow ? `Mean ${fmt(lastWindow.meanHr)} bpm, mean motion ${fmt(lastWindow.meanMotion, 2)} g.` : 'No window has been judged yet.'}
                        {persistence.candidate ? ` Waiting to confirm ${persistence.candidate} (${persistence.streak}/${persistence.required}).` : ''}
                    </p>
                </div>
            </div>

            <div className="bg-(--color-surface-dark)/5 border border-[#E8E0D5] p-6 rounded-2xl flex gap-4 text-[#7A7A52] text-sm items-start">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    These are simple threshold rules on heart rate and movement, compared with this child's own resting baseline. They are a monitoring and support aid, not a medical device, and not a trained model.
                </p>
            </div>
        </div>
    );
};

const Line: React.FC<{ k: string; v: string }> = ({ k, v }) => (
    <div className="flex justify-between gap-4 border-b border-[#E8E0D5]/60 pb-1 last:border-0">
        <dt className="text-[#7A7A52]">{k}</dt>
        <dd className="font-semibold text-right">{v}</dd>
    </div>
);
