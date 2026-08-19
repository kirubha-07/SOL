import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, ShieldAlert, PieChart } from 'lucide-react';

const mockTrendData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    hrValue: 60 + Math.random() * 30,
    movementValue: 20 + Math.random() * 60,
    escalations: Math.floor(Math.random() * 5),
    calmHours: 4 + Math.random() * 6,
    elevatedHours: 2 + Math.random() * 3,
    escalatingHours: Math.random() * 1.5,
}));

export const Trends: React.FC = () => {
    const [tab, setTab] = useState<'Today' | 'Week' | 'Month'>('Week');

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Trends & Analytics</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Macro-level physiological shifts over time.</p>
            </div>

            <div className="bg-white rounded-full p-2 border border-[#E8E0D5] inline-flex self-start shadow-sm mb-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Average HR */}
                <div className="bg-white border border-[#E8E0D5] p-8 lg:p-10 rounded-3xl shadow-sm flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Average Heart Rate</h3>
                            <div className="text-4xl font-digital font-bold text-[#2A2118] mt-2">74.2 <span className="text-lg font-sans text-[#7A7A52] tracking-wider uppercase">bpm</span></div>
                        </div>
                        <div className="p-3 bg-black/5 rounded-full"><Activity className="w-5 h-5 text-[#2A2118]" /></div>
                    </div>
                    <div className="flex-1 w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockTrendData}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A52' }} dy={10} />
                                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="hrValue" stroke="#C1633D" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#C1633D', stroke: '#fff', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Motion Index */}
                <div className="bg-white border border-[#E8E0D5] p-8 lg:p-10 rounded-3xl shadow-sm flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Motion Index</h3>
                            <div className="text-4xl font-digital font-bold text-[#2A2118] mt-2">32.8 <span className="text-lg font-sans text-[#7A7A52] tracking-wider uppercase">hz</span></div>
                        </div>
                        <div className="p-3 bg-black/5 rounded-full"><Clock className="w-5 h-5 text-[#2A2118]" /></div>
                    </div>
                    <div className="flex-1 w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockTrendData}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A52' }} dy={10} />
                                <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                                <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="movementValue" stroke="#6B8F5A" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#6B8F5A', stroke: '#fff', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* State Distribution (Area Fill) */}
                <div className="bg-white border border-[#E8E0D5] p-8 lg:p-10 rounded-3xl shadow-sm flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">State Distribution</h3>
                            <div className="text-2xl font-serif font-bold text-[#2A2118] mt-2">Calm Dominant</div>
                        </div>
                        <div className="p-3 bg-black/5 rounded-full"><PieChart className="w-5 h-5 text-[#2A2118]" /></div>
                    </div>
                    <div className="flex-1 w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockTrendData}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A52' }} dy={10} />
                                <YAxis hide />
                                <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="calmHours" stackId="1" stroke="none" fill="#6B8F5A" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="elevatedHours" stackId="1" stroke="none" fill="#D4A24C" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="escalatingHours" stackId="1" stroke="none" fill="#C1633D" fillOpacity={0.8} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Escalation Incidents (Bars) */}
                <div className="bg-white border border-[#E8E0D5] p-8 lg:p-10 rounded-3xl shadow-sm flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Incident Frequency</h3>
                            <div className="text-4xl font-digital font-bold text-[#2A2118] mt-2">12 <span className="text-lg font-sans text-[#7A7A52] tracking-wider uppercase">total</span></div>
                        </div>
                        <div className="p-3 bg-black/5 rounded-full"><ShieldAlert className="w-5 h-5 text-[#2A2118]" /></div>
                    </div>
                    <div className="flex-1 w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockTrendData}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A52' }} dy={10} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="escalations" fill="#1C1815" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
};
