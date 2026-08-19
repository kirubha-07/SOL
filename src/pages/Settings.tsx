import React from 'react';
import { User, Bell, Sliders, Shield } from 'lucide-react';

export const Settings: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-5xl font-serif font-bold text-[#2A2118] tracking-tight">Settings & Profile</h1>
                <p className="text-[#7A7A52] text-sm mt-2">Manage preferences and prototype configuration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E8E0D5] p-8 rounded-3xl shadow-sm flex flex-col gap-6">
                    <div className="flex items-center gap-4 border-b border-[#E8E0D5] pb-6">
                        <div className="w-16 h-16 bg-[#1C1815] rounded-full flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-[#2A2118]">Jane Doe</h2>
                            <p className="text-sm text-[#7A7A52]">Research Participant #042</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sliders className="w-5 h-5 text-[#7A7A52]" />
                            <span className="text-sm font-medium text-[#2A2118]">Measurement Units</span>
                        </div>
                        <span className="text-sm text-[#7A7A52] px-3 py-1 bg-black/5 rounded-full font-semibold">Standard (BPM/Hz)</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-[#7A7A52]" />
                            <span className="text-sm font-medium text-[#2A2118]">Intervention Alerts</span>
                        </div>
                        <div className="w-12 h-6 bg-[--color-calm] rounded-full relative">
                            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1C1815] text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-[#E8E0D5]/70 font-semibold mb-6 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> System Notice
                        </h3>
                        <p className="text-[#E8E0D5]/80 text-sm leading-relaxed">
                            This application is currently in **Demo Mode**. All data shown is generated from deterministic algorithms linked to the global toggle state for evaluation purposes.
                        </p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 text-xs text-[#E8E0D5]/50 leading-relaxed font-semibold">
                        <p>Research Prototype v0.1.1</p>
                        <p className="mt-1">Not for medical diagnosis or clinical use.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
