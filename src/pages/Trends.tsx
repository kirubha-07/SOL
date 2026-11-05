import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, ShieldAlert, PieChart } from 'lucide-react';
import { useSolState } from '../data/useSolState';
import { bucketWindows } from '../data/trends';

const RANGES = { '1 h': 3_600_000, '6 h': 6 * 3_600_000, '24 h': 24 * 3_600_000 } as const;
type Range = keyof typeof RANGES;
const tipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };
const axis = { fontSize: 12, fill: '#7A7A52' };

export const Trends: React.FC = () => {
    const [tab, setTab] = useState<Range>('1 h');
    const { windows, isDemo, baseline } = useSolState();
    // Anchor on the newest window so the charts don't depend on the wall clock during render.
    const anchor = windows.length ? windows[windows.length - 1].end : 0;
    const data = useMemo(() => (anchor ? bucketWindows(windows, anchor, RANGES[tab], 48) : []), [windows, anchor, tab]);

    const hrs = data.filter((b) => b.hr !== null);
    const mos = data.filter((b) => b.motion !== null);
    const avgHr = hrs.length ? hrs.reduce((a, b) => a + (b.hr as number), 0) / hrs.length : null;
    const avgMotion = mos.length ? mos.reduce((a, b) => a + (b.motion as number), 0) / mos.length : null;
    const totals = data.reduce((a, b) => ({ calm: a.calm + b.calm, elevated: a.elevated + b.elevated, escalating: a.escalating + b.escalating }), { calm: 0, elevated: 0, escalating: 0 });
    const dominant = totals.calm + totals.elevated + totals.escalating === 0 ? null : (Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0]);
    const incidents = data.reduce((a, b) => a + b.incidents, 0);
    const empty = hrs.length === 0;

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Trends & Analytics</h1>
                <p className="text-[#7A7A52] text-sm mt-2">
                    {isDemo ? 'Simulated history (Demo mode).' : 'Plotted from the 30-second windows saved on this device (kept for 24 hours; only recorded while this page is open and the band is connected).'}
                </p>
            </div>

            <div className="bg-white rounded-full p-2 border border-[#E8E0D5] inline-flex self-start shadow-sm mb-4">
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

            {empty && (
                <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 text-sm text-[#7A7A52]">
                    {baseline ? 'No windows recorded in this period yet. Keep the app open while the band is connected.' : 'No windows yet: record a resting baseline in Settings first.'}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Average Heart Rate" value={avgHr === null ? '—' : avgHr.toFixed(1)} unit="bpm" icon={<Activity className="w-5 h-5 text-[#2A2118]" />}>
                    <LineChart data={data}>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axis} dy={10} minTickGap={40} />
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.1)' }} contentStyle={tipStyle} formatter={(v) => [`${Number(v).toFixed(0)} bpm`, 'Mean HR']} />
                        <Line type="monotone" dataKey="hr" stroke="#C1633D" strokeWidth={3} dot={false} connectNulls={false} isAnimationActive={false} />
                    </LineChart>
                </Card>

                <Card title="Movement" value={avgMotion === null ? '—' : avgMotion.toFixed(2)} unit="g" icon={<Clock className="w-5 h-5 text-[#2A2118]" />}>
                    <LineChart data={data}>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axis} dy={10} minTickGap={40} />
                        <YAxis hide domain={[0, 'dataMax + 0.1']} />
                        <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.1)' }} contentStyle={tipStyle} formatter={(v) => [`${Number(v).toFixed(2)} g`, 'Mean motion']} />
                        <Line type="monotone" dataKey="motion" stroke="#6B8F5A" strokeWidth={3} dot={false} connectNulls={false} isAnimationActive={false} />
                    </LineChart>
                </Card>

                <Card title="State Distribution (minutes)" value={dominant ?? '—'} serif icon={<PieChart className="w-5 h-5 text-[#2A2118]" />}>
                    <AreaChart data={data}>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axis} dy={10} minTickGap={40} />
                        <YAxis hide />
                        <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.1)' }} contentStyle={tipStyle} />
                        <Area type="monotone" dataKey="calm" name="Calm" stackId="1" stroke="none" fill="#6B8F5A" fillOpacity={0.6} isAnimationActive={false} />
                        <Area type="monotone" dataKey="elevated" name="Elevated" stackId="1" stroke="none" fill="#D4A24C" fillOpacity={0.6} isAnimationActive={false} />
                        <Area type="monotone" dataKey="escalating" name="Escalating" stackId="1" stroke="none" fill="#C1633D" fillOpacity={0.8} isAnimationActive={false} />
                        <Area type="monotone" dataKey="exercise" name="Exercise (high motion)" stackId="1" stroke="none" fill="#7A7A52" fillOpacity={0.35} isAnimationActive={false} />
                    </AreaChart>
                </Card>

                <Card title="Escalating episodes" value={String(incidents)} unit="total" icon={<ShieldAlert className="w-5 h-5 text-[#2A2118]" />}>
                    <BarChart data={data}>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axis} dy={10} minTickGap={40} />
                        <YAxis hide allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tipStyle} />
                        <Bar dataKey="incidents" name="Episodes" fill="#1C1815" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                </Card>
            </div>
        </div>
    );
};

const Card: React.FC<{ title: string; value: string; unit?: string; serif?: boolean; icon: React.ReactNode; children: React.ReactElement }> = ({ title, value, unit, serif, icon, children }) => (
    <div className="bg-white border border-[#E8E0D5] p-8 lg:p-10 rounded-3xl shadow-sm flex flex-col min-h-[360px]">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">{title}</h3>
                <div className={serif ? 'text-2xl font-serif font-bold text-[#2A2118] mt-2' : 'text-4xl font-digital font-bold text-[#2A2118] mt-2'}>
                    {value} {unit && <span className="text-lg font-sans text-[#7A7A52] tracking-wider uppercase">{unit}</span>}
                </div>
            </div>
            <div className="p-3 bg-black/5 rounded-full">{icon}</div>
        </div>
        <div className="flex-1 w-full mt-auto min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
    </div>
);
