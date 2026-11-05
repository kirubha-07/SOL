import React from 'react';
import { HandHeart, Check } from 'lucide-react';
import { useApproval } from '../data/useApproval';
import { useActionStatus } from '../data/actions';
import { useNow } from '../data/useNow';
import { APPROVAL_TIMEOUT_MS } from '../data/eventLog';

const fmtClock = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Escalating -> one suggested action. Nothing runs until Approve is pressed. */
export const ApprovalCard: React.FC = () => {
    const { pending, tracking, actions, approve, notNow, lastResult, clearResult, mode } = useApproval();
    const now = useNow();
    const status = useActionStatus();
    const action = pending?.actionId ? actions[pending.actionId] : null;

    if (!pending || !action) {
        if (!lastResult && !tracking) return null;
        return (
            <div className="px-4 lg:px-12 mb-4" role="status">
                <div className="max-w-6xl mx-auto bg-white border border-[#E8E0D5] rounded-2xl px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#2A2118] shadow-sm">
                    <Check className="w-4 h-4 text-[--color-calm]" />
                    {lastResult && <span className={lastResult.ok ? '' : 'text-[--color-escalating]'}>{lastResult.message}</span>}
                    {tracking && tracking.decidedAt && (
                        <span className="text-[#7A7A52]">Measuring recovery: {fmtClock(now - tracking.decidedAt)} since approval{mode === 'demo' ? ' (Demo)' : ''}</span>
                    )}
                    {lastResult && <button onClick={clearResult} className="ml-auto text-xs font-semibold text-[#7A7A52] hover:underline">Dismiss</button>}
                    {status.bulb === 'dimmed' && <span className="text-xs text-[#7A7A52]">Bulb: dimmed{status.bulbDriver === 'simulated' ? ' (simulated)' : ''}</span>}
                </div>
            </div>
        );
    }

    const t = pending.trigger;
    const left = (pending.expiresAt ?? pending.t + APPROVAL_TIMEOUT_MS) - now;
    return (
        <div className="px-4 lg:px-12 mb-6" role="alertdialog" aria-live="assertive" aria-label="Support suggestion">
            <div className="max-w-6xl mx-auto bg-white border-2 border-[--color-escalating] rounded-3xl p-6 shadow-lg flex flex-col md:flex-row md:items-center gap-6">
                <div className="p-3 bg-[--color-escalating]/10 rounded-full text-[--color-escalating] self-start">
                    <HandHeart className="w-7 h-7" />
                </div>
                <div className="flex-1">
                    <div className="text-xs uppercase tracking-widest font-bold text-[--color-escalating] mb-1">
                        Escalating{mode === 'demo' ? ' · Demo' : ''}
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#2A2118]">{action.prompt}</h3>
                    <p className="text-sm text-[#7A7A52] mt-1">{action.description} Nothing happens unless you approve.</p>
                    <p className="text-xs text-[#7A7A52] mt-2">
                        Why: heart rate {t.hr === null ? '—' : t.hr.toFixed(0)} bpm{t.escalatingAt !== null ? ` (above ${t.escalatingAt.toFixed(0)})` : ''}, motion {t.motion === null ? '—' : t.motion.toFixed(2)} g. Expires in {fmtClock(left)}.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={approve} className="px-6 py-3 rounded-xl bg-[--color-surface-dark] text-white text-sm font-semibold hover:bg-black shadow-lg">
                        Approve
                    </button>
                    <button onClick={notNow} className="px-6 py-3 rounded-xl bg-black/5 text-[#2A2118] text-sm font-semibold hover:bg-black/10">
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
};
