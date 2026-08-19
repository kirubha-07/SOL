import React, { useState } from 'react';
import clsx from 'clsx';
import { useDemoMode } from '../data/demoContext';
import { mockMLInsights } from '../data/mockData';
import { Info, X } from 'lucide-react';

export const StateHero: React.FC = () => {
    const { currentState } = useDemoMode();
    const [modalOpen, setModalOpen] = useState(false);
    const insight = mockMLInsights[currentState];

    const stateColor =
        currentState === 'Calm' ? 'text-[--color-calm]' :
            currentState === 'Elevated' ? 'text-[--color-elevated]' :
                'text-[--color-escalating]';

    return (
        <>
            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-[#E8E0D5] relative flex flex-col items-center justify-center text-center">
                <h2 className="text-[#7A7A52] text-sm uppercase tracking-[0.2em] font-semibold mb-4">Current Sensory State</h2>
                <div className={clsx("text-7xl lg:text-9xl font-serif leading-none tracking-tight mb-6", stateColor)}>
                    {currentState}
                </div>

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
                            className="absolute top-6 right-6 p-2 bg-black/[0.03] hover:bg-black/[0.1] rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-serif font-bold text-[#2A2118] mb-6">ML Insights</h3>

                        <p className="text-[#2A2118]/80 text-sm mb-8 leading-relaxed">
                            {insight.interpretation}
                        </p>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#7A7A52]">
                                    <span>HR Pattern Contribution</span>
                                    <span>{insight.contributingSignals.hrPattern}%</span>
                                </div>
                                <div className="h-2 w-full bg-[#E8E0D5] rounded-full overflow-hidden">
                                    <div className="h-full bg-[--color-terracotta] transition-all duration-1000" style={{ width: `${insight.contributingSignals.hrPattern}%` }} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#7A7A52]">
                                    <span>Movement Contribution</span>
                                    <span>{insight.contributingSignals.movement}%</span>
                                </div>
                                <div className="h-2 w-full bg-[#E8E0D5] rounded-full overflow-hidden">
                                    <div className="h-full bg-[--color-elevated] transition-all duration-1000" style={{ width: `${insight.contributingSignals.movement}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#E8E0D5] flex items-center justify-between opacity-60">
                            <span className="text-xs font-medium">Confidence: {insight.confidence}%</span>
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-black/5 rounded">Prototype ML</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
