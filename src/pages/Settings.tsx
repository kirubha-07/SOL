import React, { useState } from 'react';
import clsx from 'clsx';
import { User, Sliders, Shield, Gauge, Lightbulb, HardDrive } from 'lucide-react';
import { useDemoMode } from '../data/demoContext';
import { useVitals } from '../data/useVitals';
import { useSolState } from '../data/useSolState';
import { updateSettings, useSettings } from '../data/settings';
import { clearAllLocalData } from '../data/localStore';
import { MOTION_EXERCISE_THRESHOLD, PERSISTENCE_WINDOWS } from '../data/stateEngine';

const card = 'bg-white border border-[#E8E0D5] p-8 rounded-3xl shadow-sm flex flex-col gap-6';
const label = 'text-sm font-medium text-[#2A2118]';
const input = 'w-28 bg-black/[0.03] border border-[#E8E0D5] rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#C1633D]';
const btn = 'px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40';

/** Number input that only commits a valid value on blur / Enter, so typing "0." works. */
const NumberField: React.FC<{ value: number; min: number; max: number; step: number; onCommit: (n: number) => void }> = ({ value, min, max, step, onCommit }) => {
    const [text, setText] = useState(String(value));
    const [shown, setShown] = useState(value);
    if (shown !== value) {
        setShown(value);
        setText(String(value));
    }
    const commit = () => {
        const n = parseFloat(text);
        if (Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, n)));
        else setText(String(value));
    };
    return (
        <input
            type="number" inputMode="decimal" className={input} min={min} max={max} step={step} value={text}
            onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
    );
};

export const Settings: React.FC = () => {
    const { dataMode, setDataMode } = useDemoMode();
    const vitals = useVitals();
    const sol = useSolState();
    const settings = useSettings();
    const demo = dataMode === 'demo';
    const { baseline, calibrating } = sol;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Settings & Profile</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Baseline, detection rules and where data comes from.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={card}>
                    <div className="flex items-center gap-4 border-b border-[#E8E0D5] pb-6">
                        <div className="w-16 h-16 bg-[#1C1815] rounded-full flex items-center justify-center text-white"><User className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <input
                                aria-label="Child name" value={settings.childName} onChange={(e) => updateSettings({ childName: e.target.value })}
                                className="text-xl font-serif font-bold text-[#2A2118] bg-transparent w-full focus:outline-none focus:ring-2 focus:ring-[#C1633D] rounded"
                            />
                            <p className="text-sm text-[#7A7A52]">Name or label (stays on this device)</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Sliders className="w-5 h-5 text-[#7A7A52]" /><span className={label}>Units</span></div>
                        <span className="text-sm text-[#7A7A52] px-3 py-1 bg-black/5 rounded-full font-semibold">bpm · % · g</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className={label}>Data source</span>
                        <div className="flex bg-[#1C1815] rounded-full p-1">
                            {(['live', 'demo'] as const).map((m) => (
                                <button key={m} onClick={() => setDataMode(m)} aria-pressed={dataMode === m}
                                    className={clsx('px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider', dataMode === m ? 'bg-[#FAF6F0] text-[#1C1815]' : 'text-[#FAF6F0]/70')}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-[#7A7A52]">Demo uses simulated numbers and a separate log. Live reads the band.</p>
                </div>

                <div className={card}>
                    <div className="flex items-center gap-3 border-b border-[#E8E0D5] pb-4"><Gauge className="w-5 h-5 text-[#7A7A52]" /><h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Resting baseline</h3></div>
                    {demo ? (
                        <p className="text-sm text-[#7A7A52]">Demo mode uses a simulated baseline. Switch to Live to record a real one.</p>
                    ) : (
                        <>
                            <p className="text-sm text-[#2A2118]">
                                {calibrating
                                    ? `Recording${calibrating.quick ? ' (quick)' : ''}: ${calibrating.collected}/${calibrating.target} resting windows of 30 s. Keep the child calm; windows with a lot of movement are skipped.`
                                    : baseline
                                        ? `Recorded ${new Date(baseline.recordedAt).toLocaleString()}: ${baseline.meanHr.toFixed(0)} bpm ± ${baseline.sdHr.toFixed(1)} from ${baseline.windows} windows${baseline.quick ? ' (quick calibration, demo only)' : ''}.`
                                        : 'No baseline yet. Without one, no state can be decided.'}
                            </p>
                            {vitals.status !== 'live' && !calibrating && <p className="text-xs text-(--color-escalating)">The band is not live, so recording cannot make progress yet.</p>}
                            <div className="flex flex-wrap gap-3">
                                {calibrating ? (
                                    <button className={clsx(btn, 'bg-black/5 text-[#2A2118] hover:bg-black/10')} onClick={sol.cancelCalibration}>Cancel</button>
                                ) : (
                                    <>
                                        <button className={clsx(btn, 'bg-[#1C1815] text-white hover:bg-black')} onClick={sol.startCalibration}>Record 5-minute baseline</button>
                                        <button className={clsx(btn, 'bg-black/5 text-[#2A2118] hover:bg-black/10')} onClick={sol.quickCalibration}>Quick calibration (demo only)</button>
                                    </>
                                )}
                            </div>
                            <div className="h-2 bg-[#E8E0D5] rounded-full overflow-hidden">
                                <div className="h-full bg-(--color-terracotta) transition-all" style={{ width: `${calibrating ? (calibrating.collected / calibrating.target) * 100 : baseline ? 100 : 0}%` }} />
                            </div>
                        </>
                    )}
                </div>

                <div className={card}>
                    <div className="flex items-center gap-3 border-b border-[#E8E0D5] pb-4"><Sliders className="w-5 h-5 text-[#7A7A52]" /><h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Detection rules</h3></div>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className={label}>Motion threshold (g)</div>
                            <div className="text-xs text-[#7A7A52]">Above this a window counts as exercise. Default {MOTION_EXERCISE_THRESHOLD}.</div>
                        </div>
                        <NumberField value={settings.motionThreshold} min={0.05} max={3} step={0.05} onCommit={(n) => updateSettings({ motionThreshold: n })} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className={label}>Persistence (windows)</div>
                            <div className="text-xs text-[#7A7A52]">Consecutive 30 s windows needed to change state. Default {PERSISTENCE_WINDOWS}.</div>
                        </div>
                        <NumberField value={settings.persistenceWindows} min={1} max={6} step={1} onCommit={(n) => updateSettings({ persistenceWindows: Math.round(n) })} />
                    </div>
                    <button className={clsx(btn, 'bg-black/5 text-[#2A2118] hover:bg-black/10 self-start')} onClick={() => updateSettings({ motionThreshold: MOTION_EXERCISE_THRESHOLD, persistenceWindows: PERSISTENCE_WINDOWS })}>Reset to defaults</button>
                </div>

                <div className={card}>
                    <div className="flex items-center gap-3 border-b border-[#E8E0D5] pb-4"><Lightbulb className="w-5 h-5 text-[#7A7A52]" /><h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Light bridge (optional)</h3></div>
                    <input
                        aria-label="Light bridge URL" placeholder="http://localhost:8787" value={settings.bridgeUrl} onChange={(e) => updateSettings({ bridgeUrl: e.target.value })}
                        className="w-full bg-black/[0.03] border border-[#E8E0D5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1633D]"
                    />
                    <p className="text-xs text-[#7A7A52] leading-relaxed">
                        Empty = simulated bulb (nothing real is controlled). To dim a real Tapo bulb, run the optional script in <code>/bridge</code> on the same Wi-Fi and enter its address. It has not been tested with a real bulb yet. Demo mode always uses the simulated bulb.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={card}>
                    <div className="flex items-center gap-3 border-b border-[#E8E0D5] pb-4"><HardDrive className="w-5 h-5 text-[#7A7A52]" /><h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Data stays on this device</h3></div>
                    <p className="text-sm text-[#2A2118]/80 leading-relaxed">
                        Your settings, baseline, 30-second windows and event log are saved only in this browser's local storage. SOL's server just relays the band's readings and stores nothing; the band's data itself is held by your Blynk account.
                    </p>
                    <button
                        className={clsx(btn, 'bg-(--color-escalating) text-white hover:opacity-90 self-start')}
                        onClick={() => {
                            if (window.confirm('Delete the baseline, windows, event log and settings stored on this device? This cannot be undone.')) {
                                clearAllLocalData();
                                window.location.reload();
                            }
                        }}
                    >
                        Clear local data
                    </button>
                </div>

                <div className="bg-[#1C1815] text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-[#E8E0D5]/70 font-semibold mb-6 flex items-center gap-2"><Shield className="w-4 h-4" /> System Notice</h3>
                        <p className="text-[#E8E0D5]/80 text-sm leading-relaxed">
                            {demo
                                ? 'Demo mode is on: every number shown is simulated.'
                                : 'Live mode: numbers come from the band through Blynk. Anything shown as Demo or Simulated is not real.'}
                        </p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 text-xs text-[#E8E0D5]/50 leading-relaxed font-semibold">
                        <p>Research prototype</p>
                        <p className="mt-1">A monitoring and support aid. Not a medical device.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
