import React from 'react';
import { useDemoMode } from '../data/demoContext';
import { Sun, Volume2, Watch, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export const Environment: React.FC = () => {
    const { currentState } = useDemoMode();

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Environment Controls</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Sensory-state responsive intervention system mapping.</p>
            </div>

            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 lg:p-12 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold mb-8 text-center">Closed-Loop Support Visualization</h3>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                    <div className={clsx("flex flex-col items-center justify-center text-center p-6 rounded-xl border-2 w-full md:w-1/4 transition-colors", currentState === 'Calm' ? 'border-[--color-calm] bg-[--color-calm]/5' : currentState === 'Elevated' ? 'border-[--color-elevated] bg-[--color-elevated]/5' : 'border-[--color-escalating] bg-[--color-escalating]/5')}>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#7A7A52] mb-3">1. Detect</span>
                        <span className="font-serif text-xl">{currentState}</span>
                    </div>

                    <ArrowRight className="w-6 h-6 text-[#E8E0D5] rotate-90 md:rotate-0" />

                    <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl border-2 border-[#E8E0D5] bg-black/[0.02] w-full md:w-1/4">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#7A7A52] mb-3">2. Recommend</span>
                        <span className="text-sm font-medium text-[#2A2118]">
                            {currentState === 'Calm' ? 'No intervention' : currentState === 'Elevated' ? 'Dim Lighting' : 'Engage Audio & Tactile'}
                        </span>
                    </div>

                    <ArrowRight className="w-6 h-6 text-[#E8E0D5] rotate-90 md:rotate-0" />

                    <div className={clsx("flex flex-col items-center justify-center text-center p-6 rounded-xl border-2 w-full md:w-1/4 transition-colors", currentState !== 'Calm' ? 'border-[--color-terracotta] bg-[--color-terracotta]/5' : 'border-[#E8E0D5]')}>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#7A7A52] mb-3">3. Intervene</span>
                        <span className="text-sm font-medium text-[#2A2118]">
                            Trigger Env. Hub
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={clsx("border rounded-3xl p-6 transition-all duration-300",
                    currentState === 'Elevated' ? 'bg-[--color-elevated]/10 outline outline-2 outline-[--color-elevated]/20 border-transparent' : 'bg-white border-[#E8E0D5]')}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-black/5 rounded-full text-[#2A2118]"><Sun className="w-5 h-5" /></div>
                        <div className="text-xs font-bold uppercase tracking-widest text-[--color-calm]">Connected</div>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#2A2118] mb-1">Ambient Lighting</h4>
                    <p className="text-sm text-[#7A7A52]">Philips Hue Sync Hub</p>
                    <div className="mt-6 flex justify-between items-center pt-4 border-t border-[#E8E0D5]">
                        <span className="text-sm font-medium">Status</span>
                        <span className="text-sm font-mono text-[#7A7A52]">{currentState === 'Elevated' ? 'Dimming (20%)' : 'Standard Glow'}</span>
                    </div>
                </div>

                <div className={clsx("border rounded-3xl p-6 transition-all duration-300",
                    currentState === 'Escalating' ? 'bg-[--color-escalating]/10 outline outline-2 outline-[--color-escalating]/20 border-transparent' : 'bg-white border-[#E8E0D5]')}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-black/5 rounded-full text-[#2A2118]"><Volume2 className="w-5 h-5" /></div>
                        <div className="text-xs font-bold uppercase tracking-widest text-[--color-calm]">Connected</div>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#2A2118] mb-1">Audio Regulation</h4>
                    <p className="text-sm text-[#7A7A52]">Room Sonos Network</p>
                    <div className="mt-6 flex justify-between items-center pt-4 border-t border-[#E8E0D5]">
                        <span className="text-sm font-medium">Status</span>
                        <span className="text-sm font-mono text-[#7A7A52]">{currentState === 'Escalating' ? 'Calming Freq Active' : 'Standby'}</span>
                    </div>
                </div>

                <div className={clsx("border rounded-3xl p-6 transition-all duration-300",
                    currentState === 'Escalating' ? 'bg-[--color-escalating]/10 outline outline-2 outline-[--color-escalating]/20 border-transparent' : 'bg-white border-[#E8E0D5]')}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-black/5 rounded-full text-[#2A2118]"><Watch className="w-5 h-5" /></div>
                        <div className="text-xs font-bold uppercase tracking-widest text-[--color-calm]">Connected</div>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#2A2118] mb-1">Wearable Haptics</h4>
                    <p className="text-sm text-[#7A7A52]">SAW Band Motor</p>
                    <div className="mt-6 flex justify-between items-center pt-4 border-t border-[#E8E0D5]">
                        <span className="text-sm font-medium">Status</span>
                        <span className="text-sm font-mono text-[#7A7A52]">{currentState === 'Escalating' ? 'Vibrotactile Pulse' : 'Standby'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
