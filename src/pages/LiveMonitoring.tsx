import React from 'react';
import { useDemoMode } from '../data/demoContext';
import { mockSensorData, mockDevices } from '../data/mockData';
import { WaveformChart } from '../components/WaveformChart';
import { StatCard } from '../components/StatCard';
import { Activity, Heart, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

export const LiveMonitoring: React.FC = () => {
    const { currentState } = useDemoMode();
    const sensorData = mockSensorData[currentState];
    const max30102 = mockDevices.find(d => d.name === 'MAX30102');
    const mpu = mockDevices.find(d => d.name === 'MPU6050');

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Live Monitoring</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Continuous data streams from connected peripherals.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1C1815] text-white rounded-3xl p-8 flex flex-col shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs uppercase tracking-widest text-[#E8E0D5] font-semibold">Heart Rate</span>
                            <span className="text-sm text-[#E8E0D5]/70">MAX30102 • Photoplethysmogram</span>
                        </div>
                        <Heart className="w-6 h-6 text-[--color-terracotta]" />
                    </div>

                    <div className="text-8xl font-serif leading-none tracking-tight mb-8">
                        {sensorData.heartRate} <span className="text-2xl text-[#E8E0D5]/70">bpm</span>
                    </div>

                    <WaveformChart dark height={140} />
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 shadow-sm flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">Movement Index</span>
                                <span className="text-sm text-[#7A7A52]">MPU6050 • 6-Axis Motion</span>
                            </div>
                            <Activity className="w-6 h-6 text-[#2A2118]" />
                        </div>

                        <div className="text-8xl font-serif leading-none tracking-tight mb-2 text-[#2A2118]">
                            {sensorData.movement} <span className="text-2xl text-[#7A7A52]">hz</span>
                        </div>

                        <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#E8E0D5]">
                            <span className="text-sm font-medium">Trend</span>
                            <div className="flex items-center gap-1 text-[#2A2118] font-mono text-sm font-bold bg-black/5 px-2 py-1 rounded">
                                {currentState === 'Calm' ? 'Stable' : currentState === 'Elevated' ? <><ArrowUpRight className="w-4 h-4 text-[--color-elevated]" /> Rising</> : <><ArrowUpRight className="w-4 h-4 text-[--color-escalating]" /> Spiking</>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            label="Sensor Status"
                            subValue="MAX30102"
                            value={max30102?.battery || 0}
                            unit="%"
                            icon={<div className={clsx("w-3 h-3 rounded-full", max30102?.connected ? "bg-green-500" : "bg-red-500")} />}
                        />
                        <StatCard
                            label="Sensor Status"
                            subValue="MPU6050"
                            value={mpu?.battery || 0}
                            unit="%"
                            icon={<div className={clsx("w-3 h-3 rounded-full", mpu?.connected ? "bg-green-500" : "bg-red-500")} />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
