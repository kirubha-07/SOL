import React from 'react';
import { Sun, Volume2, Watch, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { useApproval } from '../data/useApproval';
import { useActionStatus } from '../data/actions';
import { useDisplayState } from '../data/useDisplayState';
import { useSettings } from '../data/settings';
import { ACTION_ORDER, RECOVERY_GIVE_UP_MS, type ActionId } from '../data/eventLog';

const fmtDur = (s: number | null) => (s === null ? '—' : s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`);

export const Environment: React.FC = () => {
    const display = useDisplayState();
    const { actions, stats, ranking, nextAction, pending, mode } = useApproval();
    const status = useActionStatus();
    const { bridgeUrl } = useSettings();
    const state = display.state;
    const lightSimulated = mode === 'demo' || !bridgeUrl.trim();

    const toneBox = state === 'Calm' ? 'border-(--color-calm) bg-(--color-calm)/5' : state === 'Elevated' ? 'border-(--color-elevated) bg-(--color-elevated)/5' : state === 'Escalating' ? 'border-(--color-escalating) bg-(--color-escalating)/5' : 'border-[#E8E0D5]';
    const suggestion = state === 'Escalating' ? actions[pending?.actionId ?? nextAction].label : state === null ? '—' : state === 'Elevated' ? 'Quiet note only' : 'No action';

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Environment Controls</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Suggested supports, always approved by a caregiver first.</p>
            </div>

            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 lg:p-12 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold mb-8 text-center">Detect → Suggest → Caregiver approves</h3>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                    <div className={clsx("flex flex-col items-center justify-center text-center p-6 rounded-xl border-2 w-full md:w-1/4 transition-colors", toneBox)}>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#7A7A52] mb-3">1. Detect</span>
                        <span className="font-serif text-xl">{display.label}</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#E8E0D5] rotate-90 md:rotate-0" />
                    <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl border-2 border-[#E8E0D5] bg-black/[0.02] w-full md:w-1/4">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#7A7A52] mb-3">2. Suggest</span>
                        <span className="text-sm font-medium text-[#2A2118]">{suggestion}</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#E8E0D5] rotate-90 md:rotate-0" />
                    <div className={clsx("flex flex-col items-center justify-center text-center p-6 rounded-xl border-2 w-full md:w-1/4 transition-colors", pending ? 'border-(--color-terracotta) bg-(--color-terracotta)/5' : 'border-[#E8E0D5]')}>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#7A7A52] mb-3">3. Approve</span>
                        <span className="text-sm font-medium text-[#2A2118]">{pending ? 'Waiting for caregiver' : 'Nothing pending'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ControlCard
                    icon={<Sun className="w-5 h-5" />}
                    title="Ambient Lighting"
                    sub={lightSimulated ? 'Simulated bulb (no real light is controlled)' : `Local bridge: ${bridgeUrl}`}
                    status={`Bulb: ${status.bulb}${status.bulbDriver === 'simulated' || lightSimulated ? ' (simulated)' : ''}`}
                    active={status.bulb === 'dimmed'}
                    onStop={status.bulb === 'dimmed' ? () => actions['dim-light'].stop().catch(() => {}) : undefined}
                    stopLabel="Restore light"
                />
                <ControlCard
                    icon={<Volume2 className="w-5 h-5" />}
                    title="Calming Audio"
                    sub="Plays on this device"
                    status={status.audio === 'playing' ? 'Playing (looping)' : 'Stopped'}
                    active={status.audio === 'playing'}
                    onStop={status.audio === 'playing' ? () => actions['calm-audio'].stop() : undefined}
                    stopLabel="Stop audio"
                />
                <ControlCard
                    icon={<Watch className="w-5 h-5" />}
                    title="Band Vibration"
                    sub={mode === 'demo' ? 'Simulated in Demo mode' : 'Sent to the band through Blynk (V5)'}
                    status={status.hapticLastAt ? `Last sent ${new Date(status.hapticLastAt).toLocaleTimeString()}${status.hapticDemo ? ' (simulated)' : ''}` : 'Not used yet'}
                    active={false}
                />
            </div>

            <div className="bg-white border border-[#E8E0D5] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E8E0D5]">
                    <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">What has helped most (this child{mode === 'demo' ? ', Demo log' : ''})</h3>
                    <p className="text-sm text-[#7A7A52] mt-2">
                        Recovery time = seconds from pressing Approve until the reported state is back to Calm. If it has not recovered after {RECOVERY_GIVE_UP_MS / 60000} minutes it counts as “not recovered” ({RECOVERY_GIVE_UP_MS / 60000} min in the average).
                        Actions with no data are suggested first, once each; after that the lowest average comes first. This is a simple comparison, not proof that an action caused the recovery.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-black/5">
                                {['Rank', 'Action', 'Avg recovery', 'Finished trials', 'Not recovered', 'Suggested'].map((h) => (
                                    <th key={h} className="p-4 text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ACTION_ORDER.map((id: ActionId) => {
                                const s = stats[id];
                                const rank = ranking.indexOf(id) + 1;
                                return (
                                    <tr key={id} className="border-t border-[#E8E0D5]/60">
                                        <td className="p-4 font-digital font-bold">{s.trials > 0 ? rank : '—'}</td>
                                        <td className="p-4 text-sm font-medium text-[#2A2118]">{actions[id].label}{id === nextAction ? <span className="ml-2 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-black/5 rounded">next</span> : null}</td>
                                        <td className="p-4 text-sm">{s.trials > 0 ? fmtDur(s.avgRecoverySec) : 'No data yet'}</td>
                                        <td className="p-4 text-sm">{s.trials}{s.pending ? ` (+${s.pending} measuring)` : ''}</td>
                                        <td className="p-4 text-sm">{s.notRecovered}</td>
                                        <td className="p-4 text-sm">{s.suggested}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ControlCard: React.FC<{ icon: React.ReactNode; title: string; sub: string; status: string; active: boolean; onStop?: () => void; stopLabel?: string }> = ({ icon, title, sub, status, active, onStop, stopLabel }) => (
    <div className={clsx("border rounded-3xl p-6 transition-all duration-300", active ? 'bg-(--color-terracotta)/10 outline outline-2 outline-(--color-terracotta)/20 border-transparent' : 'bg-white border-[#E8E0D5]')}>
        <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-black/5 rounded-full text-[#2A2118]">{icon}</div>
        </div>
        <h4 className="font-serif text-xl font-bold text-[#2A2118] mb-1">{title}</h4>
        <p className="text-sm text-[#7A7A52]">{sub}</p>
        <div className="mt-6 flex justify-between items-center gap-3 pt-4 border-t border-[#E8E0D5]">
            <span className="text-sm font-mono text-[#7A7A52]">{status}</span>
            {onStop && <button onClick={onStop} className="text-xs font-semibold px-3 py-1 rounded-full bg-[#1C1815] text-white hover:bg-black">{stopLabel}</button>}
        </div>
    </div>
);
