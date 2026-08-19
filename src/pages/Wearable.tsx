import React from 'react';
import { mockDevices } from '../data/mockData';
import { Watch, Battery, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export const Wearable: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Wearable Status</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Hardware diagnostics and connection states.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white border border-[#E8E0D5] p-8 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 rounded-full bg-black/5 flex items-center justify-center mb-6">
                        <Watch className="w-16 h-16 text-[#2A2118] opacity-80" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#2A2118] mb-1">SAW Band Alpha</h2>
                    <p className="text-sm text-[#7A7A52] mb-6">ESP32 Core • BLE connected</p>

                    <div className="flex gap-4">
                        <span className="px-3 py-1 bg-[--color-calm]/10 text-[--color-calm] font-semibold text-xs tracking-wider uppercase rounded-full border border-[--color-calm]/20">Active</span>
                        <span className="px-3 py-1 bg-black/5 text-[#2A2118] font-semibold text-xs tracking-wider uppercase rounded-full">v0.1 Firmware</span>
                    </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockDevices.map(device => (
                        <div key={device.name} className="bg-white border border-[#E8E0D5] p-6 rounded-2xl flex flex-col shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold">{device.type}</span>
                                    <span className="font-serif font-bold text-xl text-[#2A2118]">{device.name}</span>
                                </div>
                                <div className={clsx("w-2 h-2 rounded-full mt-2", device.connected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                            </div>

                            <div className="flex justify-between items-end mt-auto text-sm text-[#2A2118] font-medium">
                                <div className="flex items-center gap-2">
                                    <Battery className="w-4 h-4 text-[#7A7A52]" /> {device.battery}%
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#7A7A52]">
                                    <RefreshCw className="w-3 h-3" /> {device.lastSync}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
