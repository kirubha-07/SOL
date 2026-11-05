import React, { useState } from 'react';
import { Clock, Download } from 'lucide-react';
import clsx from 'clsx';
import { useApproval } from '../data/useApproval';
import { eventsToCsv, type SolEvent } from '../data/eventLog';

const RANGES = { Today: 24 * 3_600_000, Week: 7 * 24 * 3_600_000, Month: 30 * 24 * 3_600_000 } as const;
type Range = keyof typeof RANGES;

const triggerText = (e: SolEvent) => {
    const t = e.trigger;
    const hr = t.hr === null ? '—' : t.hr.toFixed(0);
    const lim = e.state === 'Escalating' ? t.escalatingAt : t.elevatedAt;
    const base = t.baselineMean === null ? '' : ` (baseline ${t.baselineMean.toFixed(0)}±${(t.baselineSd ?? 0).toFixed(1)})`;
    return `HR ${hr} bpm > ${lim === null ? '—' : lim.toFixed(0)}${base}; motion ${t.motion === null ? '—' : t.motion.toFixed(2)} g ≤ ${t.motionThreshold} g`;
};
const actionLabel: Record<string, string> = { 'dim-light': 'Dim the light', 'calm-audio': 'Play calming audio', haptic: 'Gentle band vibration' };
const decisionText = (e: SolEvent) => {
    if (!e.actionId) return '—';
    if (e.decision === null) return 'Waiting for caregiver';
    if (e.decision === 'approved') return e.executed === false ? 'Approved (did not run)' : 'Approved';
    if (e.decision === 'not-now') return 'Not now';
    return 'Expired, no action';
};
const recoveryText = (e: SolEvent) => {
    if (e.decision !== 'approved' || e.executed === false) return '—';
    switch (e.recoveryStatus) {
        case 'recovered': return `${Math.floor((e.recoverySec as number) / 60)} min ${(e.recoverySec as number) % 60} s`;
        case 'not-recovered': return 'Not recovered (15 min)';
        case 'pending': return 'Measuring…';
        case 'unknown': return 'Not measured';
        default: return '—';
    }
};

export const Events: React.FC = () => {
    const [tab, setTab] = useState<Range>('Today');
    const { events, mode } = useApproval();
    const [anchor] = useState(() => Date.now());
    const shown = events.filter((e) => e.t >= anchor - RANGES[tab]);

    const exportCsv = () => {
        const blob = new Blob([eventsToCsv(events, mode)], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sol-events-${mode}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Event Timeline</h1>
                    <p className="text-[#7A7A52] text-sm mt-2">
                        {mode === 'demo' ? 'Demo log (simulated, kept separately from real events).' : 'Real log saved on this device: every time the state rose, what was suggested, and what the caregiver decided.'}
                    </p>
                </div>
                <button onClick={exportCsv} disabled={events.length === 0} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1C1815] text-white text-sm font-semibold hover:bg-black disabled:opacity-40 self-start">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            <div className="bg-white rounded-full p-2 border border-[#E8E0D5] inline-flex self-start shadow-sm">
                {(Object.keys(RANGES) as Range[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? 'bg-[#1C1815] text-white shadow-md' : 'text-[#7A7A52] hover:bg-black/5'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-[#E8E0D5] rounded-3xl overflow-hidden shadow-sm flex flex-col w-full">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-black/5 border-b border-[#E8E0D5]">
                                {['Time', 'State', 'Trigger (rule values)', 'Action suggested', 'Decision', 'Recovery'].map((h) => (
                                    <th key={h} className="p-6 text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {shown.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-sm text-[#7A7A52]">No events in this period. An event is logged whenever the reported state rises to Elevated or Escalating.</td></tr>
                            )}
                            {shown.map((event) => (
                                <tr key={event.id} className="border-b border-[#E8E0D5]/50 hover:bg-black/[0.02] transition-colors align-top">
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-[#7A7A52]" />
                                            <span className="font-digital text-[#2A2118] font-bold">{new Date(event.t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={clsx(
                                            "px-3 py-1 text-xs uppercase tracking-wider font-bold rounded-full",
                                            event.state === 'Elevated' ? 'bg-[--color-elevated]/10 text-[--color-elevated] border border-[--color-elevated]/20' : 'bg-[--color-escalating]/10 text-[--color-escalating] border border-[--color-escalating]/20'
                                        )}>
                                            {event.state}
                                        </span>
                                    </td>
                                    <td className="p-6 text-sm text-[#7A7A52] font-medium max-w-xs">{triggerText(event)}</td>
                                    <td className="p-6 text-sm text-[#2A2118] font-medium">{event.actionId ? actionLabel[event.actionId] : 'None (quiet note)'}</td>
                                    <td className="p-6 text-sm text-[#2A2118] font-medium">
                                        {decisionText(event)}
                                        {event.execError && <div className="text-xs text-[--color-escalating] mt-1">{event.execError}</div>}
                                    </td>
                                    <td className="p-6 text-sm text-[#7A7A52] font-medium">{recoveryText(event)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
