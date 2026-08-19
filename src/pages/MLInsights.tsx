import React from 'react';
import { useDemoMode } from '../data/demoContext';
import { mockMLInsights } from '../data/mockData';
import { BrainCircuit, Info } from 'lucide-react';
import clsx from 'clsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const MLInsights: React.FC = () => {
    const { currentState } = useDemoMode();
    const insight = mockMLInsights[currentState];

    const chartData = [
        { name: 'HR Pattern', value: insight.contributingSignals.hrPattern },
        { name: 'Movement', value: insight.contributingSignals.movement },
        { name: 'Recent Trend', value: insight.contributingSignals.recentTrend },
    ];

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">ML Insights Engine</h1>
                <div className="flex items-center gap-2 text-[#7A7A52] text-sm mt-2">
                    <span className="uppercase tracking-widest font-semibold text-xs border border-[#E8E0D5] px-2 py-1 rounded">Simulation</span>
                    <span>Model Version v0.1 Prototype (Not trained)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1C1815] text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-[#E8E0D5]/70 font-semibold mb-6">Predicted Sensory State</h3>
                        <div className={clsx(
                            "text-5xl font-serif leading-none tracking-tight mb-4",
                            currentState === 'Calm' ? 'text-[--color-calm]' :
                                currentState === 'Elevated' ? 'text-[--color-elevated]' : 'text-[--color-escalating]'
                        )}>
                            {insight.predictedState}
                        </div>
                        <p className="text-[#E8E0D5]/80 text-sm leading-relaxed">{insight.interpretation}</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                        <span className="text-sm font-medium">Model Confidence</span>
                        <span className="text-2xl font-serif">{insight.confidence}%</span>
                    </div>
                </div>

                <div className="bg-white border border-[#E8E0D5] p-8 rounded-3xl shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Contributing Signals</h3>
                        <BrainCircuit className="w-5 h-5 text-[#7A7A52]" />
                    </div>

                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A52' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A52' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', color: '#2A2118' }}
                                />
                                <Bar dataKey="value" fill="var(--color-terracotta)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-[--color-surface-dark]/5 border border-[#E8E0D5] p-6 rounded-2xl flex gap-4 text-[#7A7A52] text-sm items-start">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    The ML engine currently runs in a simulated state for prototype demonstration. In a production environment, this module processes high-frequency accelerometer and PPG streams sequentially to detect onset patterns of sensory escalation before behavioral markers are triggered.
                </p>
            </div>
        </div>
    );
};
