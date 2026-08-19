import React, { useState } from 'react';
import { mockEvents } from '../data/mockData';
import { Clock, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export const Events: React.FC = () => {
    const [tab, setTab] = useState<'Today' | 'Week' | 'Month'>('Today');

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Event Timeline</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Historical sensory shifts and intervention logs.</p>
            </div>

            <div className="bg-white rounded-full p-2 border border-[#E8E0D5] inline-flex self-start shadow-sm">
                {['Today', 'Week', 'Month'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t as any)}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? 'bg-[#1C1815] text-white shadow-md' : 'text-[#7A7A52] hover:bg-black/5'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-[#E8E0D5] rounded-3xl overflow-hidden shadow-sm flex flex-col w-full">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-black/5 border-b border-[#E8E0D5]">
                                <th className="p-6 text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Time</th>
                                <th className="p-6 text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Sensory State</th>
                                <th className="p-6 text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Trigger Pattern</th>
                                <th className="p-6 text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Action Taken</th>
                                <th className="p-6 text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Outcome</th>
                                <th className="p-6"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockEvents.map((event) => (
                                <tr key={event.id} className="border-b border-[#E8E0D5]/50 hover:bg-black/[0.02] transition-colors group cursor-pointer">
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-[#7A7A52]" />
                                            <span className="font-digital text-[#2A2118] font-bold">{event.time}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={clsx(
                                            "px-3 py-1 text-xs uppercase tracking-wider font-bold rounded-full",
                                            event.state === 'Calm' ? 'bg-[--color-calm]/10 text-[--color-calm] border border-[--color-calm]/20' :
                                                event.state === 'Elevated' ? 'bg-[--color-elevated]/10 text-[--color-elevated] border border-[--color-elevated]/20' :
                                                    'bg-[--color-escalating]/10 text-[--color-escalating] border border-[--color-escalating]/20'
                                        )}>
                                            {event.state}
                                        </span>
                                    </td>
                                    <td className="p-6 text-sm text-[#7A7A52] font-medium">{event.triggerPattern}</td>
                                    <td className="p-6 text-sm text-[#2A2118] font-medium">{event.action}</td>
                                    <td className="p-6 text-sm text-[#7A7A52] font-medium">{event.outcome}</td>
                                    <td className="p-6 text-right">
                                        <button className="p-2 bg-black/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
