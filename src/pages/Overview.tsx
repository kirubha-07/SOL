import React from 'react';
import { useDemoMode } from '../data/demoContext';
import { useVitals } from '../data/useVitals';
import { useDisplayState, readingText, isMuted, statusLabel } from '../data/useDisplayState';
import { useNow, formatAge } from '../data/useNow';
import { StateHero } from '../components/StateHero';
import { StatCard } from '../components/StatCard';
import { WaveformChart } from '../components/WaveformChart';
import { useApproval } from '../data/useApproval';
import { Heart, Activity, CheckCircle2, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export const Overview: React.FC = () => {
    const { dataMode } = useDemoMode();
    const vitals = useVitals();
    const display = useDisplayState();
    const currentState = display.state;
    const muted = isMuted(vitals);
    const hr = readingText(vitals, 'hr');
    const spo2 = readingText(vitals, 'spo2');
    const motion = readingText(vitals, 'motion');
    const now = useNow();
    const { events, pending } = useApproval();

    return (
        <div className="flex flex-col gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4 lg:mb-8">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Monitor Sensory State</h1>
                    <p className="text-[#7A7A52] mt-2 lg:mt-4 text-sm lg:text-base">Live heart-rate and movement monitoring with caregiver-approved support.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column - Hero and Waveform */}
                <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
                    <StateHero />

                    <div className="bg-[#1C1815] rounded-3xl p-6 lg:p-8 flex-col shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs uppercase tracking-widest text-[#E8E0D5] font-semibold">Pulse Wave</span>
                                <span className="text-sm text-[#E8E0D5]/70">{dataMode === 'demo' ? 'Simulated heart rate (Demo)' : 'Heart rate • MAX30102'}</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className={clsx("font-digital leading-none tracking-tight text-white", hr.words ? "text-xl lg:text-2xl" : "text-4xl lg:text-6xl", muted && "opacity-40")}>{hr.text}</span>
                                {!hr.words && hr.text !== '—' && <span className="text-sm text-[#E8E0D5]/70 mb-1">bpm</span>}
                            </div>
                        </div>

                        <WaveformChart dark height={160} />

                        <div className="mt-8 flex justify-between border-t border-white/10 pt-4">
                            <span className="text-xs text-[#E8E0D5]/60 uppercase tracking-widest">{statusLabel(vitals)}</span>
                            <span className="text-xs text-[#E8E0D5]/60 uppercase tracking-widest">
                                {vitals.lastUpdated ? `Updated ${formatAge(now - vitals.lastUpdated)}` : 'No data yet'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats and Recommendations */}
                <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            label="Movement"
                            value={motion.text}
                            unit={motion.text === '—' ? undefined : 'g'}
                            muted={muted}
                            subValue={dataMode === 'demo' ? 'MPU6050 · simulated' : 'MPU6050'}
                            icon={<Activity className="w-5 h-5" />}
                        />
                        <StatCard
                            label="SpO2"
                            value={spo2.text}
                            unit={spo2.words || spo2.text === '—' ? undefined : '%'}
                            muted={muted}
                            subValue={dataMode === 'demo' ? 'MAX30102 · simulated' : 'MAX30102'}
                            icon={<Droplets className="w-5 h-5" />}
                        />
                    </div>

                    <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-sm flex-1">
                        <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold mb-6">Current Recommendation</h3>
                        {currentState === null && (
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-black/5 rounded-full text-[#7A7A52]">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-serif text-[#2A2118] font-bold mb-2">{display.label}</h4>
                                    <p className="text-sm text-[#7A7A52] leading-relaxed">{display.hint ?? 'No recommendation until the band reports data.'}</p>
                                </div>
                            </div>
                        )}
                        {currentState === 'Calm' && (
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-[--color-calm]/10 rounded-full text-[--color-calm]">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-serif text-[#2A2118] font-bold mb-2">Maintain Base State</h4>
                                    <p className="text-sm text-[#7A7A52] leading-relaxed">Heart rate is within this child's usual resting range. No action suggested.</p>
                                </div>
                            </div>
                        )}
                        {currentState === 'Elevated' && (
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-[--color-elevated]/10 outline outline-1 outline-[--color-elevated]/20 rounded-full text-[--color-elevated]">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-serif text-[#2A2118] font-bold mb-2">Keep an eye on things</h4>
                                    <p className="text-sm text-[#7A7A52] leading-relaxed">Heart rate is above this child's usual range. This is just a note: no action is suggested at this level.</p>
                                </div>
                            </div>
                        )}
                        {currentState === 'Escalating' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-[--color-escalating]/10 outline outline-1 outline-[--color-escalating]/20 rounded-full text-[--color-escalating]">
                                        <Heart className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-serif text-[--color-escalating] font-bold mb-2">Support suggestion</h4>
                                        <p className="text-sm text-[#7A7A52] leading-relaxed">
                                            {pending ? 'A suggested action is waiting for your approval at the top of the page. Nothing happens until you approve it.' : 'No suggestion is waiting (it was answered or expired).'}
                                        </p>
                                    </div>
                                </div>
                                <Link to="/environment" className="mt-4 flex items-center justify-center gap-2 py-3 bg-[--color-surface-dark] text-white hover:bg-black rounded-xl text-sm font-semibold transition-colors shadow-lg">
                                    Open Environment
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Recent Events</h3>
                            <Link to="/events" className="text-xs text-[--color-terracotta] font-semibold hover:underline">View All</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            {events.length === 0 && <span className="text-sm text-[#7A7A52]">No events recorded yet.</span>}
                            {events.slice(0, 2).map(event => (
                                <div key={event.id} className="flex justify-between items-center pb-4 border-b border-[#E8E0D5]/60 last:border-0 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-[#2A2118]">{event.state}</span>
                                        <span className="text-xs text-[#7A7A52]">{event.decision ? event.decision === 'not-now' ? 'Not now' : event.decision === 'approved' ? 'Approved' : 'Expired, no action' : event.actionId ? 'Waiting for caregiver' : 'Quiet note'}</span>
                                    </div>
                                    <span className="text-xs font-mono text-[#7A7A52]">{new Date(event.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
